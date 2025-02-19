import React from "react";
import { Task } from "./types/types";
import TaskItem from "./TaskItem";

interface ColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  moveTask: (dragIndex: number, hoverIndex: number) => void;
  changeTaskStatus: (taskId: string, newStatus: string) => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  tasks,
  status,
  moveTask,
  changeTaskStatus,
}) => {
  return (
    <div className="flex flex-col gap-5 p-4 swim-lane xl:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-white/90">
          {title}
          <span
            className={`
    inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium 
    ${
      status === "todo"
        ? "bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80 "
        : status === "inProgress"
        ? "text-warning-700 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400"
        : status === "completed"
        ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
        : ""
    }
  `}
          >
            {tasks.length}
          </span>
        </h3>
        {/* Add dropdown menu here if needed */}
      </div>
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
      ))}
    </div>
  );
};

export default Column;
