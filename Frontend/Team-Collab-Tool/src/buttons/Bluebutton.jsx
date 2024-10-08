const Bluebutton = ({ text, onClick }) => {
  return (
    <button
      className={`bg-[#12aef5] hover:opacity-80 text-white font-bold py-2 px-4 rounded`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Bluebutton;
