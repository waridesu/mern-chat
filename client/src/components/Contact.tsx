import Avatar from "./Avatar.tsx";

export default function Contact({id, username, selectedUserId, setSelectedUserId, online}:
{id:string, username:string, selectedUserId:string| null, setSelectedUserId: (id: string) => void, online: boolean}) {
    return (
        <div
            onClick={() => setSelectedUserId(id)}
            style={{
                display: "flex",
                alignItems: "center",
                marginInline: "auto",
                width: "fit-content",
                gap: "10px"
            }}
            className={(id === selectedUserId ? 'currentUser' : '')}>
            <Avatar online={online} userId={id} username={username}/>
            <div>{username}</div>
            <div>{id}</div>
        </div>
    );
}
