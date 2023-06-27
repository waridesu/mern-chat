import { UserContext } from "./UserContext.tsx";
import { useContext } from "react";
import RegisterAndLoginForm from "./enterName.tsx";
import Chat from "./Chat.tsx";

export default function Routes() {
    const {username, id} = useContext(UserContext)
    if (username) {
        return <Chat/>
    }

    return ( <RegisterAndLoginForm/>)
}
