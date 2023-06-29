import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import axios from "axios";
interface IUserContext {
    username: string | null;
    setUsername: Dispatch<SetStateAction<string | null>>;
    id: string | null;
    setId: Dispatch<SetStateAction<string | null>>;
}
export const UserContext= createContext<IUserContext>({
    username: null,
    setUsername: () => { console.warn('setUsername was called without a provider') },
    id: null,
    setId: () => { console.warn('setId was called without a provider') },
});

export function UserContextProvider({children}: {children: ReactNode}) {
    const [username, setUsername] = useState<string| null>(null);
    const [id, setId] = useState<string| null>(null);
    useEffect(() => {
        axios.get("/profile"  ).then(({data}) => {
            setId(data.userId)
            setUsername(data.username)
        })
    }, []);
    return (<UserContext.Provider value={{username, setUsername, id, setId}}>
        {children}
    </UserContext.Provider>)
}
