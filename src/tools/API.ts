/* eslint-disable @typescript-eslint/camelcase */
export const BRAT: ApiModuleObject = {
  CGI: { url: "/brat/api/ajax.cgi", method: "post" },
  repeat: { url: "/brat/api/repeat_annotation", method: "post" },
  current_page: { url: "/brat/api/current_page_annotation", method: "post" },
  status_of_clear: {
    url: "/brat/api/status_of_clear_current_page_annotation",
    method: "post"
  },
  label_standard: { url: "/brat/api/label_standard", method: "post" }
};
