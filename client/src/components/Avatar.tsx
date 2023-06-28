export default function Avatar({userId, username}) {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"]
    const userIdBase10 = parseInt(userId, 16)
    const colorIndex = userIdBase10 % colors.length
    const color = colors[colorIndex]
    return (
        <div style={{background: color, borderRadius: "50%", padding: "10px", flexShrink: '0'}}>{username.slice(0,1)}</div>
    )
}
