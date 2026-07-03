"""Text encoding cache and API embedding handler."""

from __future__ import annotations

from threading import RLock
from typing import TYPE_CHECKING

from handlers.base import StateHandlerBase, with_state_lock
from state.app_state_types import AppState, TextEncodingResult

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig


class TextHandler(StateHandlerBase):
    def __init__(self, state: AppState, lock: RLock, config: RuntimeConfig) -> None:
        super().__init__(state, lock)
        self._config = config

    @with_state_lock
    def _get_cached_prompt(self, prompt: str, enhance_prompt: bool) -> TextEncodingResult | None:
        te = self.state.text_encoder
        if te is None:
            return None
        return te.prompt_cache.get((prompt.strip(), enhance_prompt))

    @with_state_lock
    def _cache_prompt(self, prompt: str, enhance_prompt: bool, result: TextEncodingResult) -> None:
        te = self.state.text_encoder
        if te is None:
            return

        max_size = self.state.app_settings.prompt_cache_size
        if max_size <= 0:
            return

        key = (prompt.strip(), enhance_prompt)
        if key in te.prompt_cache:
            del te.prompt_cache[key]
        elif len(te.prompt_cache) >= max_size:
            oldest = next(iter(te.prompt_cache))
            del te.prompt_cache[oldest]
        te.prompt_cache[key] = result

    @with_state_lock
    def _set_api_embeddings(self, result: TextEncodingResult | None) -> None:
        if self.state.text_encoder is not None:
            self.state.text_encoder.api_embeddings = result

    def clear_api_embeddings(self) -> None:
        self._set_api_embeddings(None)

    def should_use_local_encoding(self) -> bool:
        """Decide whether to use local text encoding based on availability.

        The user's ``use_local_text_encoder`` setting acts as a tiebreaker only
        when **both** the API key and the local encoder are available.  When only
        one option exists, that option is used regardless of the setting.
        """
        settings = self.state.app_settings.model_copy(deep=True)
        api_available = bool(settings.ltx_api_key)
        text_encoder_dir = self._config.model_path("text_encoder")
        local_available = text_encoder_dir.exists() and any(text_encoder_dir.iterdir())

        if api_available and local_available:
            return settings.use_local_text_encoder  # setting is tiebreaker
        return local_available  # use whichever is available

    def prepare_text_encoding(self, prompt: str, enhance_prompt: bool) -> None:
        """Local-only text encoding. Cloud API encoding is disabled.

        Raises RuntimeError if no local text encoder is available.
        """
        text_encoder_dir = self._config.model_path("text_encoder")
        local_available = text_encoder_dir.exists() and any(text_encoder_dir.iterdir())

        if not local_available:
            raise RuntimeError(
                "TEXT_ENCODING_NOT_CONFIGURED: The local text encoder is not installed. "
                "Please download the text encoder from Settings."
            )

        gemma_root = self.resolve_gemma_root()

        if gemma_root is None:
            raise RuntimeError(
                "TEXT_ENCODING_NOT_CONFIGURED: The local text encoder is not installed. "
                "Please download the text encoder from Settings."
            )

    def resolve_gemma_root(self) -> str | None:
        text_encoder_dir = self._config.model_path("text_encoder")
        return str(text_encoder_dir)

    def _prepare_api_embeddings(self, prompt: str, enhance_prompt: bool) -> TextEncodingResult | None:
        # Cloud text encoding is disabled — only local encoding is supported.
        self.clear_api_embeddings()
        return None
