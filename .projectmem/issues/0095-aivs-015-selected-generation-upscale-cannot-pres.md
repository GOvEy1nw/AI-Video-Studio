# #0095 AIVS-015 selected-generation Upscale cannot preserve stable Asset IDs in GenSpaceMediaInput.id because that field owns the input-instance ID

- 2026-08-17T10:14:00Z `issue`: AIVS-015 selected-generation Upscale cannot preserve stable Asset IDs in GenSpaceMediaInput.id because that field owns the input-instance ID [frontend/views/genspace/types.ts]
- 2026-08-17T10:23:58Z `attempt`: Added transient assetId to GenSpace media inputs and preserved it through footer and gallery upscale handoffs [frontend/views/genspace/types.ts] (worked)
- 2026-08-17T10:24:03Z `fix`: Upscale handoffs now preserve stable asset identity separately from input-instance IDs [frontend/views/genspace/types.ts]
