const Router = require('koa-router');
const rooms = new Router();
const roomsCtrl = require('./rooms.controller');

rooms.get('/', roomsCtrl.getRooms); // 방 목록 조회, 한번에 최대 12개씩
rooms.patch('/profile/thumbnail', roomsCtrl.updateThumbnail); // 방 이미지 DB에 업로드
rooms.get('/:username', roomsCtrl.getUserRoom); // 방 이미지 검색
rooms.patch('/profile', roomsCtrl.updateProfile); // 방 설정 업데이트
rooms.post('/playerlist', roomsCtrl.joinPlayerlist); // playerlist 추가

module.exports = rooms;