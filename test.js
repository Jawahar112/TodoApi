import axios from "axios";
axios.post('http://localhost:3000/api/login',{Email:"user@gmail.com",Password:"1234567"}).then((data)=>{
    console.log(data.data.status);
})