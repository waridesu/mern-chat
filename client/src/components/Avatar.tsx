export default function Avatar({userId, username, online}: {userId: string, username: string, online: boolean}) {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"]
    const userIdBase10 = parseInt(userId, 16)
    const colorIndex = userIdBase10 % colors.length
    const color = colors[colorIndex]
    return (
        <div style={{background: color, borderRadius: "50%", padding: "10px", flexShrink: '0', position: "relative"}}>{username?.slice(0,1)}
            {online && <span style={{position: "absolute", bottom: "0", right:"0"}}>online</span>}
        </div>
    )
}
