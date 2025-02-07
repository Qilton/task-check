import { useState } from "react";
import axios from "axios";

function App() {
  const tasksList = [
    "Hello World",
    "HTML Practice",
    "Style a page with Tailwind",
    "Implement Authentication",
    "Connect to a Database",
    "Optimize Performance",
    "Deploy the Application",
  ];

  const [tasks, setTasks] = useState(Array(tasksList.length).fill(false));
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);
  const [links, setLinks] = useState(Array(tasksList.length).fill(""));

  const handleOpenModal = (index) => {
    console.log("Opening modal for task index:", index); // Debugging
    setCurrentTaskIndex(index); // ✅ Ensure the correct task index is set
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentTaskIndex(null);
  };

  const handleSubmitLink = async () => {
    if (currentTaskIndex === null) {
      alert("Error: Task index is not set.");
      return;
    }

    const inputElement = document.getElementById("task-link");
    const newLink = inputElement.value.trim();

    if (!newLink) {
      alert("Please enter a valid link!");
      return;
    }

    const taskNumber = currentTaskIndex + 1; // ✅ Now properly set
    console.log("Submitting task:", taskNumber, "Link:", newLink); // Debugging

    // Store link locally
    setLinks((prev) => {
      const updatedLinks = [...prev];
      updatedLinks[currentTaskIndex] = newLink;
      return updatedLinks;
    });

    // Send to backend using Axios
    try {
      const response = await axios.post("http://localhost:8000/submit", {
        taskNumber,
        taskName: tasksList[currentTaskIndex], // Sending Task Name too
        submissionLink: newLink,
      });

      console.log("Response from backend:", response.data);
      alert("Submission successful!");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Error submitting the task.");
    }

    handleCloseModal();
  };

  return (
    <div className="flex flex-col items-center gap-10 h-screen bg-black text-white p-10">
      <div className="font-bold text-2xl">Task Checker</div>
      <div className="flex flex-col gap-4">
        <div className="text-lg font-semibold">Tasks</div>
        {tasksList.map((task, i) => (
          <div key={i} className="flex items-center justify-between gap-4 w-96 border-b pb-2">
            <div>
              <span className="font-bold">Task {i + 1}: </span> {task}
            </div>
            {links[i] ? (
              <a href={links[i]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                View Submission
              </a>
            ) : (
              <button onClick={() => handleOpenModal(i)} className="bg-blue-500 px-3 py-1 rounded">
                Submit
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-gray-800 p-5 rounded-md w-96">
            <h2 className="text-lg font-semibold mb-3">
              Submit Task {currentTaskIndex + 1}: {tasksList[currentTaskIndex]}
            </h2>
            <input
              id="task-link"
              type="text"
              placeholder="Enter submission link"
              className="w-full p-2 rounded text-black"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={handleCloseModal} className="bg-gray-600 px-3 py-1 rounded">
                Cancel
              </button>
              <button onClick={handleSubmitLink} className="bg-green-500 px-3 py-1 rounded">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
