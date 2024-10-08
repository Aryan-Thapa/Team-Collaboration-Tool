import { useForm } from "react-hook-form";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../services/ProjectsApi";
import { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { toast, Toaster } from "react-hot-toast";
import { projectFields } from "../constants/InputField";
import { useFetchWorkspaceDropdownQuery } from "../services/WorkspaceApi";
import { getToken } from "../services/LocalStorageService";
import Select from "react-select";

const ProjectForm = ({ onClose, initialData }) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: initialData || {},
  });

  const { access_token } = getToken();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const {
    data: workspaces,
    isLoading,
    refetch,
  } = useFetchWorkspaceDropdownQuery();
  const [server_error, setServerError] = useState({});

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("description", initialData.description);
      setValue("workspace", initialData.workspace); // Ensure workspace is set during edit mode
    }
  }, [initialData, setValue]);

  useEffect(() => {
    if (access_token) {
      refetch(); // Refetch workspace dropdown when access_token changes
    }
  }, [access_token, refetch]);

  const onSubmit = async (data) => {
    const actualData = {
      name: data.name,
      description: data.description,
      workspace: data.workspace,
    };

    let res;
    if (initialData) {
      res = await updateProject({ id: initialData.id, ...actualData });
    } else {
      res = await createProject(actualData);
    }

    if (res.error) {
      setServerError(res.error.data);
      toast.error(res.error.data.detail);
    }

    if (res.data) {
      toast.success("Project " + (initialData ? "Updated" : "Created"));
      onClose();
    }
  };

  // Convert workspaces to react-select format
  const workspaceOptions =
    workspaces?.map((workspace) => ({
      value: workspace.id,
      label: workspace.name,
    })) || [];

  // Get the currently selected workspace value (for initialData when editing)
  const selectedWorkspace = workspaceOptions.find(
    (option) => option.value === watch("workspace")
  );

  return (
    <div className="dropDownFormPosition">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="dropDownFormStyling">
        <h2 className="dropDownFormHeading">
          {initialData ? "Edit Project" : "Add New Project"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section>
            {projectFields.map((projectfield, index) => (
              <div key={index}>
                <span className="formLabel">
                  {projectfield.title}

                  {projectfield.id === "description" ? (
                    <span></span>
                  ) : (
                    <span className="text-red-700">*</span>
                  )}
                </span>

                {projectfield.id === "description" ? (
                  <textarea
                    maxLength="80"
                    id={`${projectfield.id}`}
                    {...register(`${projectfield.id}`)}
                    className={`mt-1 block w-full border resize-none ${
                      server_error[projectfield.id]
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md shadow-sm p-2`}
                    data-tooltip-id={`${projectfield.id}-tooltip`}
                    data-tooltip-content={
                      server_error[projectfield.id]
                        ? server_error[projectfield.id][0]
                        : ""
                    }
                  />
                ) : (
                  <input
                    id={projectfield.id}
                    type="text"
                    {...register(projectfield.id)}
                    className={`mt-1 block w-full border ${
                      server_error[projectfield.id]
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md shadow-sm p-2`}
                    data-tooltip-id={`${projectfield.id}-tooltip`}
                    data-tooltip-content={
                      server_error[projectfield.id]
                        ? server_error[projectfield.id][0]
                        : ""
                    }
                  />
                )}
                <Tooltip id={`${projectfield.id}-tooltip`} />
              </div>
            ))}

            {/* Workspace Dropdown */}
            <div>
              <label className="formLabel" htmlFor="workspace">
                Workspace<span className="text-red-700">*</span>
              </label>
              <Select
                {...register("workspace")} // Bind to react-hook-form
                value={selectedWorkspace} // Set selected value for editing
                onChange={(option) => setValue("workspace", option?.value)} // Update form value on change
                options={workspaceOptions} // Set options
                isDisabled={isLoading || !workspaces?.length} // Disable if loading or no options
                className={`mt-1 block w-full ${
                  server_error.workspace ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm`}
              />
            </div>
          </section>

          <div className="dropDownFormButtons">
            <button type="button" onClick={onClose} className="graybutton">
              Close
            </button>

            <button type="submit" className="bluebutton">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
