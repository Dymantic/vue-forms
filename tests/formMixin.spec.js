import sinon from "sinon";
import moxios from "moxios";
import { assert } from "chai";
import formMixin from "../src/formMixin";
import { mount, shallow } from "vue-test-utils";
import TestComponent from "./TestFormComponent.vue";

describe("a vue form mixin", () => {
  sinon.assert.expose(assert, { prefix: "" });

  let formWrapper = (attributes = {}, form_type = "create") => {
    return shallow(TestComponent, {
      mixins: [formMixin],
      propsData: {
        url: "/test-url",
        formAttributes: attributes,
        formType: form_type
      }
    });
  };

  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("has the correct props", () => {
    const attributes = formMixin.props["form-attributes"];
    assert.isFalse(attributes.required);
    assert.deepEqual(attributes.default(), {});
    assert.equal(attributes.type, Object);

    const url = formMixin.props.url;
    assert.isTrue(url.required);
    assert.equal(url.type, String);

    const form_type = formMixin.props["form-type"];
    assert.equal(form_type.type, String);
    assert.equal(form_type.default, "create");

    const button_text = formMixin.props["button-text"];
    assert.equal(button_text.type, String);
    assert.equal(button_text.default, "Submit");
  });

  it("has the correct data", () => {
    const expectedData = {
      modalOpen: false,
      waiting: false,
      mainError: ""
    };

    assert.deepEqual(formMixin.data(), expectedData);
  });

  it("clears errors before it submits", () => {
    let wrapper = formWrapper();
    wrapper.vm.form.errors.name = "Invalid name";
    wrapper.vm.form.errors.age = "Invalid age";

    wrapper.vm.submit();

    assert.equal(wrapper.vm.form.errors.name, "");
    assert.equal(wrapper.vm.form.errors.age, "");
  });

  it("calls canSubmit before it submits the form", () => {
    let wrapper = formWrapper();
    let spy = sinon.spy(wrapper.vm, "canSubmit");

    wrapper.vm.submit();

    assert.isTrue(spy.called);
  });

  it("posts the form data", () => {
    let wrapper = formWrapper({ name: "Testy", age: 33 });

    let spy = sinon.spy(wrapper.vm, "postData");

    wrapper.vm.submit();
    assert.isTrue(spy.calledWith({ name: "Testy", age: 33 }));
  });

  it("does not post form if canSubmit returns false", () => {
    let wrapper = formWrapper();

    sinon.stub(wrapper.vm, "canSubmit").returns(false);
    let spy = sinon.spy(wrapper.vm, "postData");

    wrapper.vm.submit();

    assert.isFalse(spy.called);
  });

  it("sets waiting to try while posting data", () => {
    let wrapper = formWrapper();

    moxios.stubRequest("/test-url", {
      status: 200,
      response: { name: "Mooz" }
    });

    wrapper.vm.submit();
    assert.isTrue(wrapper.vm.waiting);

    moxios.wait(() => {
      assert.isFalse(wrapper.vm.waiting);
    });
  });

  it("still returns waiting to false if the request fails", () => {
    let wrapper = formWrapper();

    moxios.stubRequest("/test-url", {
      status: 500,
      responseText: "That failed"
    });

    wrapper.vm.submit();
    assert.isTrue(wrapper.vm.waiting);

    moxios.wait(() => {
      assert.isFalse(wrapper.vm.waiting);
    });
  });

  it("it clears the form after posting data on a create form", () => {
    let wrapper = formWrapper();

    wrapper.vm.form.data.name = "Testy";
    wrapper.vm.form.data.age = 33;

    moxios.stubRequest("/test-url", {
      status: 200,
      response: { name: "Testy", age: 33 }
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.equal("", wrapper.vm.form.data.name);
      assert.equal("", wrapper.vm.form.data.age);
    });
  });

  it("resets the form with the parsed response data if not a create form", () => {
    let wrapper = formWrapper({ name: "Testy", age: 33 }, "update");

    wrapper.vm.form.data.name = "Testy";
    wrapper.vm.form.data.age = 33;

    moxios.stubRequest("/test-url", {
      status: 200,
      response: { name: "New Testy", age: 66 }
    });

    wrapper.vm.submit();

    moxios.wait(param => {
      assert.equal("New Testy", wrapper.vm.form.data.name);
      assert.equal(66, wrapper.vm.form.data.age);
    });
  });

  it("closes the modal after successfully submitting", () => {
    let wrapper = formWrapper();

    wrapper.vm.modalOpen = true;

    moxios.stubRequest("/test-url", {
      status: 200
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.isFalse(wrapper.vm.modalOpen, "modal should be closed");
    });
  });

  it("emits the correct event on successfull submission for create", () => {
    let wrapper = formWrapper({}, "create");

    moxios.stubRequest("/test-url", {
      status: 200
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.exists(wrapper.emitted()["create-submitted"]);
    });
  });

  it("emits the correct event for a successful update submission", () => {
    let wrapper = formWrapper({}, "update");

    moxios.stubRequest("/test-url", {
      status: 200,
      response: {
        name: "Updated name",
        age: 88
      }
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.exists(wrapper.emitted()["update-submitted"]);
      assert.deepEqual(wrapper.emitted()["update-submitted"][0][0], {
        name: "Updated name",
        age: 88
      });
    });
  });

  it("populates the errors when validation fails", () => {
    let wrapper = formWrapper({}, "update");

    moxios.stubRequest("/test-url", {
      status: 422,
      response: {
        errors: {
          name: ["Invalid name"],
          age: ["Invalid age"]
        }
      }
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.equal(wrapper.vm.form.errors.name, "Invalid name");
      assert.equal(wrapper.vm.form.errors.age, "Invalid age");
    });
  });

  it("it emits an invalid submission event if validation fails", () => {
    let wrapper = formWrapper();

    moxios.stubRequest("/test-url", {
      status: 422,
      response: {
        errors: {}
      }
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.exists(wrapper.emitted()["invalid-submission"]);
    });
  });

  it("sets the main error if a failed submission is not a 422", () => {
    let wrapper = formWrapper();

    moxios.stubRequest("/test-url", {
      status: 500
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.isNotEmpty(wrapper.vm.mainError);
    });
  });

  it("emits a failed submission event if the submission fails", () => {
    let wrapper = formWrapper();

    moxios.stubRequest("/test-url", {
      status: 500
    });

    wrapper.vm.submit();

    moxios.wait(() => {
      assert.exists(wrapper.emitted()["failed-submission"]);
    });
  });
});
