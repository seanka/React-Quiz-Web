import { createContext, useReducer } from "react";

const QuizContext = createContext();
const initialState = {
  questions: [],

  //* 'loading', 'error', 'ready', 'active', 'finished'
  status: "loading",

  index: 0,
  answer: null,
  points: 0,
  highscore: 0,
  secondsRemaining: null,
};

const SECS_PER_QUESTION = 30;

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return { ...state, questions: action.payload, status: "ready" };

    case "dataFailed":
      return { ...state, status: "error" };

    case "start":
      return { ...state, status: "active", secondsRemaining: state.questions.length * SECS_PER_QUESTION };

    case "newAnswer":
      const question = state.questions.at(state.index);

      return { ...state, answer: action.payload, points: question === action.payload ? state.points + question.point : state.points };

    case "nextQuestion":
      return { ...state, index: state.index + 1, answer: null };

    case "finish":
      return { ...state, status: "finished", highscore: state.points > state.highscore ? state.points : state.highscore };

    case "restart":
      return { ...initialState, questions: state.questions, status: "ready" };

    case "tick":
      return { ...state, secondsRemaining: state.secondsRemaining - 1, status: state.secondsRemaining === 0 ? "finished" : state.status };

    default:
      throw new Error("Action unknown");
  }
}
function QuizProvider({ children }) {
  const [{ questions, status, index, answer, points, highscore, secondsRemaining }, dispatch] = useReducer(reducer, initialState);

  const numQuestions = questions.length;
  const maxPossiblePoints = questions.reduce((prev, cur) => prev + cur.points);

  useEffect(() => {
    fetch("http://localhost:9009/questions")
      .then((res) => res.json())
      .then((data) => dispatch({ type: "dataReceived", payload: data }))
      .catch((err) => dispatch({ type: "dataFailed" }));
  }, []);

  return (
    <QuizContext.Provider
      value={{ questions, status, index, answer, points, highscore, secondsRemaining, numQuestions, maxPossiblePoints, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

function useQuiz() {
  const context = QuizContext();
  return context;
}

export { QuizProvider, useQuiz };
