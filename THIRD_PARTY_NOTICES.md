# Third-party notices

## Downloaded WanGP

AiVS downloads WanGP/Wan2GP during Windows first-run or repair from the configured
upstream branch under the WanGP Community License. That licence applies to the runtime
source; it does not grant rights to optional model assets.

## MMAudio processor code

The downloaded WanGP integration includes MMAudio processor code and vendored
Synchformer and BigVGAN components. Their licence texts ship with the downloaded WanGP
source under `postprocessing/mmaudio/ext/` (including each component's
`incl_licenses/` directory). AiVS invokes the registered WanGP MMAudio processor locally
and does not redistribute a second copy.

## Optional MMAudio checkpoint assets

MMAudio processor assets are optional and are downloaded only through WanGP's
registered `DeepBeepMeep/Wan2.1` definitions (`mmaudio`,
`DFN5B-CLIP-ViT-H-14-378`, and `bigvgan_v2_44khz_128band_512x`). They are not
bundled with AiVS. The upstream repository does not currently declare a
repository-level weights licence, so AiVS records weights licensing and commercial
use as unknown and does not infer permission. Users must review and comply with any
terms supplied upstream at download time.
