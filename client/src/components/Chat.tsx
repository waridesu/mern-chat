import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext.tsx";
import axios from "axios";
import Contact from "./Contact.tsx";
import io, { Socket } from "socket.io-client";

interface IMessage {
    _id: string;
    text: string;
    sender: string;
    recipient: string;
    file?: string;
}

export default function Chat() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlinePeople, setOnlinePeople] = useState<{ userId: string; username: string; }[] | null>(null)
    const [offlinePeople, setOfflinePeople] = useState<{ _id: string; username: string; }[] | null>(null)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [newMsg, setNewMsg] = useState<string>('')
    const [messages, setMessages] = useState<IMessage[]>([])
    const {username, id, setId, setUsername} = useContext(UserContext)
    const messagesContainer = useRef<HTMLDivElement>(null);
    const lastEl = useRef<HTMLDivElement>(null);

    useEffect(() => {
        connectToSocketIO()
    }, [])

    useEffect(() => {
        const el = lastEl.current
        setTimeout(() => {
            el?.scrollIntoView()
        }, 500)
    }, [messages])

    useEffect(() => {
        axios.get('/people').then(({data}: { data: { _id: string; username: string }[] }) => {
            console.log('data', data);
            const OfflinePeople = data.filter(
                p => p._id !== id && !onlinePeople?.some(op => op.userId === p._id)
            );
            setOfflinePeople(OfflinePeople)
        })
    }, [onlinePeople])

    useEffect(() => {
        if (selectedUserId) {
            axios.get(`/messages/${selectedUserId}`).then(({data}) => {
                setMessages(data)
            })
        }
    }, [selectedUserId])

    function connectToSocketIO() {
        const socketIOClient = io("http://localhost:4040");
        socketIOClient.on('connect', () => {
            console.log('Connected to Socket.IO server');
        });

        socketIOClient.on('message', handleMessages);

        socketIOClient.on('disconnect', () => {
            console.log('Disconnected. Trying to reconnect');
            setTimeout(() => {
                connectToSocketIO();
            }, 1000);
        });
        setSocket(socketIOClient);


        // Cleanup on unmounting
        return () => {
            socketIOClient.disconnect();
        };
    }

    function showOnlinePeople(peopleArray: { userId: string, username: string }[]) {
        const people = peopleArray.reduce((acc: { userId: string; username: string; }[], obj) => {
            const existingObj = acc?.find(item => item.userId === obj.userId);
            if (!existingObj) acc.push(obj);
            return acc;
        }, []);
        setOnlinePeople(people)
    }

    function handleMessages(e: MessageEvent) {
        console.log('message', e);
        const msgData = JSON.parse(e.data)
        console.log(msgData);
        if ('online' in msgData) {
            showOnlinePeople(msgData.online)
        } else if ('text' in msgData) {
            setMessages(prev => [...prev, {...msgData}]
            )
        }
    }

    function sendMessage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        socket?.emit('message',{recipient: selectedUserId, text: newMsg, id });
        setNewMsg('');
        if (id && selectedUserId) {
            setMessages(perv =>
                ([...perv, {_id: crypto.randomUUID(), text: newMsg, sender: id, recipient: selectedUserId}])
            )
        }
    }

    function Logout() {
        axios.post('/logout').then(() => {
            setSocket(null)
            setId(null)
            setUsername(null)
        })
    }

    function sendFile(ev: React.ChangeEvent<HTMLInputElement>) {
        const inputFile = ev.target.files?.[0];
        if (!inputFile) {
            console.log('no file');
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(inputFile);
        reader.onload = () => {
            const file = {
                name: inputFile.name,
                data: reader.result
            };
            socket?.emit('message',{recipient: selectedUserId, text: newMsg, file});
            setNewMsg('');
            if (id && selectedUserId) {
                setMessages(prev => ([
                    ...prev,
                    {_id: crypto.randomUUID(), text: newMsg, sender: id, recipient: selectedUserId}
                ]));
            }
            if (file) {
                axios.get(`/messages/${selectedUserId}`).then(({data}) => {
                    setMessages(data)
                })
            }
        };
    }


    return (
        <>
            <div style={{display: "flex", height: "100%"}}>
                <div style={{width: "25%", backgroundColor: "red"}}>
                    <div>
                        {onlinePeople && onlinePeople.filter(({userId}) => userId !== id)?.map((person) =>
                            <Contact
                                key={person.userId}
                                id={person.userId}
                                username={person.username}
                                selectedUserId={selectedUserId ? selectedUserId : null}
                                online={true}
                                setSelectedUserId={() => setSelectedUserId(person.userId)}
                            />
                        )}
                        {offlinePeople && offlinePeople?.map((person) =>
                            <Contact
                                key={person._id}
                                id={person._id}
                                username={person.username}
                                selectedUserId={selectedUserId ? selectedUserId : null}
                                online={false}
                                setSelectedUserId={() => setSelectedUserId(person._id)}
                            />
                        )}
                    </div>
                    <div>
                        <span>Logged in as {username}</span>
                        <button onClick={Logout}>Logout</button>
                    </div>
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
                        <div ref={messagesContainer} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: "auto",
                            maxHeight: "calc(100% - 40px)"
                        }}>
                            {messages.filter((item, index, self) =>
                                self.findIndex(m => m._id === item._id) === index || item.sender === id
                            ).map(({text, sender, file}, i) =>
                                <div style={sender === id ? {
                                    marginLeft: "auto",
                                    width: 'fit-content',
                                    maxWidth: '50%'
                                } : {
                                    marginRight: "auto", width: 'fit-content',
                                    maxWidth: '50%'
                                }} key={i}
                                >{sender === id ? 'myText:' : ''}
                                    {text}
                                    {file &&
                                        <img style={{display: "flex", maxWidth: "400px"}}
                                             src={axios.defaults.baseURL + '/uploads/' + file} alt={'file'}></img>
                                    }
                                </div>
                            )}
                            <div ref={lastEl}></div>
                        </div>}
                    {!!selectedUserId && <form
                        onSubmit={sendMessage}
                        style={{display: "flex", marginTop: "auto", overflow: "hidden"}}>
                        <input
                            value={newMsg}
                            onChange={(e) => setNewMsg(e.target.value)}
                            style={{flexGrow: "1", backgroundColor: "white", color: '#000'}} type="text"/>
                        <label style={{
                            width: '40px',
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            file
                            <input type="file" style={{visibility: "hidden"}} onChange={sendFile}/>
                        </label>
                        <button type={"submit"}>Send</button>
                    </form>}
                </div>
            </div>
            <div></div>
        </>
    )
}
