type ButtonProps = {

  text:string;

  type?:
  "button" |
  "submit" |
  "reset";

  disabled?:boolean;

};



export default function Button({

  text,

  type="button",

  disabled=false

}:ButtonProps){


  return (

    <button

      type={type}

      disabled={disabled}

      className="
      w-full
      rounded-xl
      bg-blue-600
      py-4
      font-semibold
      text-white

      shadow-lg

      transition-all
      duration-300

      hover:-translate-y-1
      hover:bg-blue-700
      hover:shadow-xl

      active:scale-95

      disabled:cursor-not-allowed
      disabled:bg-gray-400
      "

    >

      {text}

    </button>

  );

}