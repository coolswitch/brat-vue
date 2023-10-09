import { VueConstructor } from "vue";
import {
  Pagination,
  Dialog,
  Popover,
  Table,
  TableColumn,
  Loading,
  MessageBox,
  Message,
  Input,
  Button,
  ButtonGroup,
  Radio,
  RadioGroup,
  Checkbox,
  Icon,
  Divider,
  Tabs,
  TabPane,
  Form,
  FormItem,
  Select,
  Option
} from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

export default {
  install(Vue: VueConstructor) {
    Vue.use(Pagination);
    Vue.use(Dialog);
    Vue.use(Input);
    Vue.use(Radio);
    Vue.use(RadioGroup);
    Vue.use(Select);
    Vue.use(Option);
    Vue.use(Checkbox);
    Vue.use(Button);
    Vue.use(ButtonGroup);
    Vue.use(Table);
    Vue.use(TableColumn);
    Vue.use(Popover);
    Vue.use(Divider);
    Vue.use(Icon);
    Vue.use(Tabs);
    Vue.use(TabPane);
    Vue.use(Form);
    Vue.use(FormItem);

    Vue.use(Loading.directive);

    Vue.prototype.$loading = Loading.service;
    Vue.prototype.$msgbox = MessageBox;
    Vue.prototype.$alert = MessageBox.alert;
    Vue.prototype.$confirm = MessageBox.confirm;
    Vue.prototype.$prompt = MessageBox.prompt;
    Vue.prototype.$message = Message;
  }
};
