export default class Form {
  constructor(fields) {
    this.defaults = { ...fields };
    this.data = { ...fields };
    this.errors = this.makeErrorObject(fields);
  }

  resetFields(overrides = {}) {
    const original = { ...this.defaults };
    this.data = Object.assign(original, overrides);
  }

  setValidationErrors(errors) {
    Object.keys(errors).forEach(field => {
      if (this.errors.hasOwnProperty(field)) {
        this.errors[field] = Array.isArray(errors[field])
          ? errors[field][0]
          : errors[field];
      }
    });
  }

  clearErrors() {
    Object.keys(this.errors).forEach(field => (this.errors[field] = ""));
  }

  makeErrorObject(fields) {
    return Object.keys(fields).reduce((object, field_name) => {
      object[field_name] = "";
      return object;
    }, {});
  }
}
