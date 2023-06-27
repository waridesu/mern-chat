import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.tsx";

export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')
    const {setUsername: setLoggedInUsername, setId} = useContext(UserContext)

    async function handleSubmit(ev: any) {
        ev.preventDefault();
        const url = isLoginOrRegister === 'login' ? '/login' : '/register'

        const {data} = await axios.post(url, {username, password})
        setLoggedInUsername(username)
        setId(data.id)
    }

    return (
        <div>
            <h1>Enter your name</h1>
            <form onSubmit={handleSubmit}>
                <input value={username}
                       placeholder={"username"}
                       onChange={ev => setUsername(ev.target.value)}
                       type="text"/>
                <input value={password}
                       placeholder={"password"}

                       onChange={ev => setPassword(ev.target.value)}
                       type="text"/>

                <button>{isLoginOrRegister.charAt(0).toUpperCase() + isLoginOrRegister.slice(1)}</button>

                {isLoginOrRegister === 'register' && (
                    <div>
                        Already have an account?
                        <button
                            onClick={() => setIsLoginOrRegister('login')}>
                            Login
                        </button>
                    </div>
                )}
                {isLoginOrRegister === 'login' && (
                    <div>
                        Dont have an account?
                        <button
                            onClick={() => setIsLoginOrRegister('register')}>
                            Register
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}
