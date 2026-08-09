# Third-party notices

## Bundled WanGP

AiVS bundles WanGP/Wan2GP under the WanGP Community License. That licence applies
to the bundled runtime source; it does not grant rights to optional model assets.

## MMAudio processor code

The bundled WanGP integration includes MMAudio processor code and vendored
Synchformer and BigVGAN components. Their retained licence texts are located at
`Wan2GP/postprocessing/mmaudio/ext/synchformer/LICENSE` and
`Wan2GP/postprocessing/mmaudio/ext/bigvgan_v2/LICENSE` (with additional dependency
notices in that component's `incl_licenses/` directory). AiVS invokes the registered
WanGP MMAudio processor locally and does not redistribute a second copy.

## Optional MMAudio checkpoint assets

MMAudio processor assets are optional and are downloaded only through WanGP's
registered `DeepBeepMeep/Wan2.1` definitions (`mmaudio`,
`DFN5B-CLIP-ViT-H-14-378`, and `bigvgan_v2_44khz_128band_512x`). They are not
bundled with AiVS. The upstream repository does not currently declare a
repository-level weights licence, so AiVS records weights licensing and commercial
use as unknown and does not infer permission. Users must review and comply with any
terms supplied upstream at download time.
