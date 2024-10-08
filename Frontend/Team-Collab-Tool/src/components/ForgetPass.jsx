// import React from 'react'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSendPasswordResetEmailMutation } from "../services/UserAuthApi";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import InputField from "../shared/InputField";
import ProgressBar from "../shared/ProgressBar";
function Forgetpass() {
  const [server_error, setServerError] = useState({});
  const [sendPasswordResetEmail] = useSendPasswordResetEmailMutation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  // fetching data from form onsubmit
  const onSubmit = async (data) => {
    console.log("data from frontend", data);
    const actualData = {
      email: data.Email,
    };

    // data sent to backend and backend response stored in res
    const res = await sendPasswordResetEmail(actualData);

    if (res.error) {
      console.log("inside res.error", res);
      setServerError(res.error.data.errors);
      if (res.error.data.errors.non_field_errors) {
        toast.error(res.error.data.errors.non_field_errors[0], {
          duration: 4000, // Toast will be visible for 4 seconds
        });
      }
      console.log(res.error);
    }

    if (res.data) {
      console.log("inside res.data", res);
      toast.success(res.data.msg, {
        duration: 4000, // Toast will be visible for 4 seconds
      });
      setServerError({});
      document.getElementById("password-reset-form").reset();
    }
  };

  return (
    <div className="authFormContainer">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="authpageHeading">Send Reset Password Link</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="authForm"
        id="password-reset-form"
      >
        <InputField
          label="Email"
          type="email"
          name="Email"
          register={register}
          error={server_error.email}
          tooltipId="email-tooltip"
          placeholder="Email"
        />
        <div className="flex items-center justify-between">
          <button className="bluebutton" type="submit" disabled={isSubmitting}>
            Send
          </button>
        </div>
      </form>
      {isSubmitting && <ProgressBar />}
    </div>
  );
}

export default Forgetpass;
