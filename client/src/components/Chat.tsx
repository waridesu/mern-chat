import { useEffect, useState } from "react";

export default function Chat() {
    const [ws, setWs] = useState<WebSocket| null>(null)
    const [onlinePeople, setonlinePeople] = useState<{userId: string; username: string;}[]| null>(null)
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:4040")
        setWs(ws);
        ws.addEventListener( 'message', handleMessages);
    }, [])
    function showOnlinePeople(peopleArray: {userId: string, username: string}[]) {
        const people = peopleArray.reduce((acc: { userId: string; username: string; }[], obj) => {
            const existingObj = acc?.find(item => item.userId === obj.userId);
            if (!existingObj) acc.push(obj);
            return acc;
        }, []);
        setonlinePeople(people)
        console.log(people)
    }
    function handleMessages(e) {
       const msgData = JSON.parse(e.data)
        if ('online' in msgData) {
            showOnlinePeople(msgData.online)
        }

    }
    return (
        <>
            <div style={{display: "flex", height: "100%"}}>
                <div style={{width:"25%", backgroundColor:"red"}}>
                    {onlinePeople?.map((person) =>
                        <>
                            <div>{person.username}</div>
                            <div>{person.userId}</div>
                        </>
                    )}
                </div>

                <div style={{width:"75%", height: "100%",display: "flex", flexDirection:"column", backgroundColor:"green"}}>
                    <div>messages with selected user</div>
                    <form style={{ display: "flex",marginTop:"auto"}}>
                        <input style={{width:"100%", backgroundColor:"white"}} type="text"/>
                        <button>Send</button>
                    </form>
                </div>
            </div>
            <div></div>
        </>
    )
}
