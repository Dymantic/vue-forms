    <template>
        <div>
        </div>
    </template>

    <script>
import Form from "../src/Form";

export default {
  data() {
    return {
      form: new Form({
        name: this.formAttributes.name || "",
        age: this.formAttributes.age || ""
      })
    };
  },

  methods: {
    canSubmit() {
      return true;
    },

    parseResponseData(data) {
      return data;
    }
  }
};
</script>