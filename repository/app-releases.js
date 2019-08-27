const request = require("superagent");

const {
  baseUrl,
} = require("../lib/config");

const apiAndroidLatest = `${baseUrl.getNextApi()}/apps/android/latest`
const apiAndroidReleases = `${baseUrl.getNextApi()}/apps/android/releases`

class AppRelease {

  async getLatest() {
    const resp = await request.get(apiAndroidLatest);

    return resp.body;
  }

  async getList() {
    const resp = await request.get(apiAndroidReleases);

    return resp.body;
  }
}

exports.androidRelease = new AppRelease();
