import { useState } from "react";
import TaskForm from "./TaskForm";
import { useDeleteTaskMutation } from "../services/TasksApi";
import ConfirmationDialog from "./ConfirmationDialog"; // optional for delete confirmation
import { GrInProgress } from "react-icons/gr";
import { FaClockRotateLeft } from "react-icons/fa6";
import { MdDoneOutline } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast";

const TaskCard = ({ task, onActionComplete }) => {
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteTask] = useDeleteTaskMutation();

  const handleEdit = () => {
    setShowForm(true);
  };

  const handleDelete = async () => {
    const res = await deleteTask(task.id);
    if (res.error) {
      toast.error(
        res.error.data.detail ? "You are not allowed to delete this Task" : null
      );
    }
    if (!res.error) {
      onActionComplete();
      toast.success("Task Deleted");
    }
  };

  const openConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const confirmDelete = () => {
    handleDelete();
    closeConfirmDialog();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    onActionComplete();
  };

  // Determine the background color and icon based on the status
  const statusDetails = {
    pending: {
      color: "bg-red-500",
      icon: <FaClockRotateLeft />,
    },
    in_progress: {
      color: "bg-orange-400",
      icon: <GrInProgress />,
    },
    completed: {
      color: "bg-green-500",
      icon: <MdDoneOutline />,
    },
  };

  const { color: statusClass, icon } = statusDetails[task.status] || {
    color: "bg-gray-200",
    icon: null,
  };

  // Format deadline to a readable format
  const formattedDeadline = new Date(task.deadline).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour24: true,
    timeZone: "UTC",
  });

  return (
    <div className="cardStyle flex flex-col">
      <Toaster position="top-center" reverseOrder={false} />
      <div>
        <h3 className="cardName">{task.title}</h3>
      </div>
      <div>
        {/* <p className="cardFields">{task.description}</p> */}
        <p className="cardFields">Assigned To: {task.assigned_user_name}</p>
        <p className="cardFields">Deadline: {formattedDeadline}</p>
        <p className="cardFields">Project: {task.project_name}</p>
      </div>

      <div className="flex justify-between space-x-2">
        <span className={`taskicon ${statusClass} `}>{icon}</span>
        <div className="flex gap-2">
          <button className="cardBlueButton" onClick={handleEdit}>
            Edit
          </button>
          <button className="cardRedButton" onClick={openConfirmDialog}>
            Delete
          </button>
        </div>
      </div>

      {showForm && <TaskForm initialData={task} onClose={handleCloseForm} />}

      {showConfirmDialog && (
        <ConfirmationDialog
          message="Are you sure you want to delete this task?"
          onConfirm={confirmDelete}
          onCancel={closeConfirmDialog}
        />
      )}
    </div>
  );
};

export default TaskCard;
