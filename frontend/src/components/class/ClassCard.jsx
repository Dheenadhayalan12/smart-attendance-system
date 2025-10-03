const ClassCard = ({ classData, onClick, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${classData.subject}"?`)) {
      onDelete(classData.classId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div
        onClick={onClick}
        className="p-6 cursor-pointer"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {classData.subject || 'Unnamed Class'}
        </h3>
        <p className="text-gray-600 mb-4">{classData.description || 'No description'}</p>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Roll: {classData.rollNumberRange}</span>
          <span>{classData.department || 'No department'}</span>
        </div>
      </div>
      <div className="px-6 pb-4">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
        >
          Delete Class
        </button>
      </div>
    </div>
  );
};

export default ClassCard;