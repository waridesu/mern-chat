import './App.css'
import EnterName from "./components/enterName.tsx";
import axios from "axios";
import { UserContextProvider } from "./components/UserContext.tsx";
import Routes from "./components/routes.tsx";

function App() {
    axios.defaults.baseURL = "http://localhost:4040";
    axios.defaults.withCredentials = true;
    return (
        <>
            <UserContextProvider>
                <Routes/>
            </UserContextProvider>
        </>

    )
}

export default App
