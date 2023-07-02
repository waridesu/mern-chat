const { getUserDataFromToken } = require("../utils/utils");
const MessageModel = require("../models/Message");

async function getMessages(req, res) {
    const { userId } = req.params;
    const userData = await getUserDataFromToken(req);
    const ourUserId = userData.userId;
    const msg = await MessageModel.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] }
    }).sort({ createdAt: 1 });
    res.json(msg);
}

module.exports = { getMessages };
