import * as core from '@actions/core';

console.log("SETTING OUTPUTS")
core.setOutput('MANIFEST_INFO', {'manifestName': "manifest.json", "manifestArtifact": "artifact"})