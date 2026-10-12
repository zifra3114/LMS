# LMS Video Server

Admin ki upload ki hui lecture video ko FFmpeg se HLS mein badalta hai aur sirf us batch ke
students ko dikhata hai. Angular app se alag chalta hai.

## Ek baar ka setup (Windows)

1. **Node.js 20 ya naya** install karein (`node -v` se check karein).
2. **FFmpeg** install karein. PowerShell mein:
   ```
   winget install Gyan.FFmpeg
   ```
   Phir terminal band karke naya kholein aur `ffmpeg -version` chalayein. Version dikhe to theek hai.
3. Is folder mein:
   ```
   npm install
   copy .env.example .env
   ```
4. `.env` kholein aur bharein:
   - `SUPABASE_URL` aur `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard, Project Settings, API.
     `service_role` key bohat khufiya hai, ise Angular ya GitHub par kabhi na dalein.
   - `ADMIN_EMAILS`: wohi email jis se aap admin panel mein login karte hain.
   - `PLAYBACK_SECRET`: ye command chalakar jo lambi string aaye wo paste karein:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
5. Supabase SQL Editor mein `lectures_video_server.sql` run karein.

## Chalana

```
npm start
```

`Video server chal raha hai: http://localhost:3000` likha aaye to tayyar hai.
Browser mein `http://localhost:3000/health` kholein, `{"ok":true}` aana chahiye.

Development mein code badalte hi dobara chalane ke liye `npm run dev`.

## Test

```
npm test
```

(FFmpeg install hona zaroori hai. Test apni nakli videos banata hai aur Supabase nahi chhoota.)

## Kaise kaam karta hai

| Kaam | Kahan |
|---|---|
| Admin video 8 MB ke tukron mein bhejta hai, net toot jaye to wahin se jaari | `POST /api/lectures/:id/upload` |
| Upload poori hone par FFmpeg convert shuru | `POST /api/lectures/:id/upload/complete` |
| Student ke liye dekhne ka link (login, batch, Published check) | `POST /api/lectures/:id/playback` |
| Playlist aur video ke tukre (sirf theek token par) | `GET /hls/:id/...` |
| Lecture delete par video ki files saaf | `DELETE /api/lectures/:id/video` |

- Agar video pehle se H.264 + AAC hai (phone, Zoom, screen recording) to FFmpeg sirf tukre karta hai,
  dobara encode nahi karta, isliye 2 se 4 ghante ki video bhi chand minute mein tayyar ho jati hai.
- Doosri codec ho to ek baar encode hoti hai (1080p tak), jis mein waqt lagta hai.
- Ek waqt mein ek hi video convert hoti hai.
- Videos `storage/` folder mein hoti hain. Is folder ka backup rakhein, ye GitHub par nahi jata.

## Live karte waqt

- Server kisi VPS par chalayein (jaise Oracle Cloud Always Free) aur `pm2` se hamesha chalta rakhein.
- Angular HTTPS par ho to ye server bhi HTTPS par hona chahiye (Caddy se free certificate mil jata hai),
  warna browser video block kar dega.
- `.env` mein `CORS_ORIGIN` apne Angular domain par karein, aur Angular ke
  `core/config/video-server.ts` mein `VIDEO_SERVER_URL` badlein.
- Disk mein kam az kam utni jagah rakhein jitni videos ki total size hai, aur upload ke waqt
  ek video ki size ke barabar extra.
