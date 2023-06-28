import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar.tsx";
import { UserContext } from "./UserContext.tsx";
import axios from "axios";

export default function Chat() {
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [onlinePeople, setOnlinePeople] = useState<{ userId: string; username: string; }[] | null>(null)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [newMsg, setNewMsg] = useState<string>('')
    const [messages, setMessages] = useState<{ _id?: string; text: string; sender: string; recipient: string }[]>([])
    const {id} = useContext(UserContext)
    const lastDivInMsgs = useRef<HTMLDivElement>(null);

    useEffect(() => {
        connectToWebSocket()
    }, [])
    useEffect(() => {
        const div = lastDivInMsgs.current
        div?.scrollIntoView({behavior: "smooth"})
    }, [messages])
    useEffect(() => {
        if (selectedUserId) {
            axios.get(`/messages/${selectedUserId}`).then(({data}) => {
                setMessages(data)
            })
        }
    }, [selectedUserId])

    function connectToWebSocket() {
        const ws = new WebSocket("ws://localhost:4040")
        setWs(ws);
        ws.addEventListener('message', handleMessages);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect');
                connectToWebSocket()
            }, 1000)
        });
    }

    function showOnlinePeople(peopleArray: { userId: string, username: string }[]) {
        const people = peopleArray.reduce((acc: { id?: string; userId: string; username: string; }[], obj) => {
            const existingObj = acc?.find(item => item.userId === obj.userId);
            if (!existingObj) acc.push(obj);
            return acc;
        }, []);
        setOnlinePeople(people)
    }

    function handleMessages(e) {
        const msgData = JSON.parse(e.data)
        if ('online' in msgData) {
            showOnlinePeople(msgData.online)
        } else if ('text' in msgData) {
            console.log('wsGetMessages');
            setMessages(prev =>
                [...prev, {_id: msgData._id, text: msgData.text, sender: msgData.sender, recipient: msgData.recipient}]
            )
        }
    }

    function sendMessage(e) {
        e.preventDefault()
        ws?.send(JSON.stringify({
            message:
                {recipient: selectedUserId, text: newMsg}
        }))
        setNewMsg('');
        if (id && selectedUserId) {
            setMessages(perv =>
                ([...perv, {id: Date.now(), text: newMsg, sender: id, recipient: selectedUserId}])
            )
        }
    }

    return (
        <>
            <div style={{display: "flex", height: "100%"}}>
                <div style={{width: "25%", backgroundColor: "red"}}>
                    {onlinePeople?.filter(({userId}) => userId !== id)?.map((person) =>
                        <div
                            onClick={() => setSelectedUserId(person.userId)}
                            key={person.userId}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginInline: "auto",
                                width: "fit-content",
                                gap: "10px"
                            }}
                            className={(person.userId === selectedUserId ? 'currentUser' : '')}>
                            <Avatar userId={person.userId} username={person.username}/>
                            <div>{person.username}</div>
                            <div>{person.userId}</div>
                        </div>
                    )}
                </div>

                <div style={{
                    width: "75%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "green"
                }}>
                    {!selectedUserId && <div> &larr; select user form sidebar</div>}
                    {!!selectedUserId &&
                        <div style={{display: 'flex', flexDirection: 'column', overflowY: "auto"}}>
                            {messages.filter((item, index, self) =>
                                self.findIndex(m => m._id === item._id) === index || item.sender === id
                            ).map(({text, sender}, i) =>
                                <div style={sender === id ? {
                                    marginLeft: "auto",
                                    width: 'fit-content',
                                    maxWidth: '50%'
                                } : {
                                    marginRight: "auto", width: 'fit-content',
                                    maxWidth: '50%'
                                }} key={i}
                                >{sender === id ? 'myText:' : ''}{text}</div>
                            )}
                            <div ref={lastDivInMsgs}></div>
                        </div>}
                    {!!selectedUserId && <form
                        onSubmit={sendMessage}
                        style={{display: "flex", marginTop: "auto"}}>
                        <input
                            value={newMsg}
                            onChange={(e) => setNewMsg(e.target.value)}
                            style={{width: "100%", backgroundColor: "white"}} type="text"/>
                        <button type={"submit"}>Send</button>
                    </form>}
                </div>
            </div>
            <div></div>
        </>
    )
}
