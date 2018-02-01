import Form from "../src/Form";
import { assert } from "chai";

describe("a form object", () => {
  it("a new form object should be instantialble", () => {
    const form = new Form({ name: "Testy" });
    assert.instanceOf(form, Form);
    assert.equal(form.data.name, "Testy");
  });

  it("should keep a record of the initial defaults", () => {
    const form = new Form({ name: "Original Testy" });
    form.data.name = "New Testy";

    assert.equal(form.defaults.name, "Original Testy");
    assert.equal(form.data.name, "New Testy");
  });

  it("constructs a new instance with the correct error object", () => {
    const form = new Form({ name: "Testy", age: 30, is_cool: false });
    const expectedErrorObject = {
      name: "",
      age: "",
      is_cool: ""
    };

    assert.deepEqual(form.errors, expectedErrorObject);
  });

  it("sets error messages correctly", () => {
    const form = new Form({ name: "Testy", age: 25, is_cool: true });
    const errors = { name: "Invalid name", age: "Invalid age" };

    form.setValidationErrors(errors);

    assert.equal(form.errors.name, "Invalid name");
    assert.equal(form.errors.age, "Invalid age");
    assert.equal(form.errors.is_cool, "");
  });

  it("can clear the error messages", () => {
    const form = new Form({ name: "Testy", age: 25, is_cool: true });
    const errors = { name: "Invalid name", age: "Invalid age" };

    form.setValidationErrors(errors);
    form.clearErrors();

    assert.equal(form.errors.name, "");
    assert.equal(form.errors.age, "");
    assert.equal(form.errors.is_cool, "");
  });

  it("resets the form data to the original defaults", () => {
    const form = new Form({ name: "Testy", age: 25, is_cool: true });
    form.data.name = "New Guys";
    form.data.age = 99;
    form.data.is_cool = false;

    form.resetFields();

    assert.equal(form.data.name, "Testy");
    assert.equal(form.data.age, 25);
    assert.isTrue(form.data.is_cool);
  });

  it("allows overrides when resetting fields", () => {
    const form = new Form({ name: "Testy", age: 25, is_cool: true });
    form.data.name = "New Guys";
    form.data.age = 99;
    form.data.is_cool = false;

    form.resetFields({ age: 33, is_cool: false });

    assert.equal(form.data.name, "Testy");
    assert.equal(form.data.age, 33);
    assert.isFalse(form.data.is_cool);
  });
});
