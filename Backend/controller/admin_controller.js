var Admin = require("../db/admindb");
const bcrypt =require("bcrypt")
module.exports={

    async addadmin(req,res){

        const salt=await bcrypt.genSalt(10);

        const hp=await bcrypt.hash("123456",salt);

        var insobj={
            name:"jack",
            email:"jack@gmail.com",
            password:hp
        }

        await Admin.create(insobj);
        res.send("Admin Add");
    },
    async login(req, res) {
        var e = req.body.email;
        var p = req.body.password;   // was req.body.pass — field name mismatch fixed

        if (!e || !p) {
            return res.status(400).json({ msg: "Email and password are required" });
        }

        var data = await Admin.findOne({ email: e });
        if (data == null) {
            return res.status(401).json({ msg: "Invalid login" });
        }

        if (!data.password) {
            return res.status(500).json({ msg: "Admin account has no password set. Visit /admin/add to seed." });
        }

        bcrypt.compare(p, data.password, async (err, result) => {
            if (err) {
                return res.status(500).json({ msg: "Server error during authentication" });
            }
            if (result === true) {
                var udata = {
                    name: data.name,
                    id:   data._id
                };
                res.json(udata);
            } else {
                res.status(401).json({ msg: "Invalid login" });
            }
        });
    }

}