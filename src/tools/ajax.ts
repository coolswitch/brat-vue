/**
 * 服务请求调用
 */
import axios, { AxiosInstance } from "axios";

export class Request {
  instance: AxiosInstance;
  constructor() {
    this.instance = axios.create({
      // baseURL: process.env.VUE_APP_API,
      // headers: {
      //   token: ""
      // },
      timeout: 16000
    });
  }

  request(urlobj: ApiObject, params = {}, config: PlainObject = {}) {
    return new Promise((resolve, reject) => {
      // urlobj.method = 'get';
      if (urlobj.method !== "get") {
        params = { data: params };
      } else {
        params = { params };
      }
      this.instance
        .request({ ...urlobj, ...params, ...config })
        .then(response => {
          if (response.headers["content-type"] != "application/json") {
            return resolve(this.download(response));
          }
          if (response.data.code === 200) resolve(response.data);
          else reject(response);
        })
        .catch(reject);
    });
  }

  download(response: PlainObject) {
    const blob = new Blob([response.data], {
      type: response.headers["content-type"]
    });
    const patt = new RegExp("=([^;]+\\.[^\\.;]+);*");
    const contentDisposition = decodeURI(
      response.headers["content-disposition"]
    );
    const result = patt.exec(contentDisposition);
    let fileName = result && result.length > 1 ? result[1] : "brat.zip";
    fileName = fileName.replace(/"/g, "");
    const aLink = document.createElement("a");
    aLink.href = URL.createObjectURL(blob);
    aLink.setAttribute("download", fileName); // 设置下载文件名称
    document.body.appendChild(aLink);
    aLink.click();
    aLink.remove();
    return fileName;
  }
}

const $axios = new Request();
export default $axios.request.bind($axios);
