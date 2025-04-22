The **generator.mjs** script requires `finalized.bin` file to be presented with a SSZ
representation of a BeaconState which is used as a seed for our fixtures data.

Consider running the following command to obtain it (it assumes httpie to be installed):

```sh
http -d $CL_URL/eth/v2/debug/beacon/states/finalized Accept:application/octet-stream
```
