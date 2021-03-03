const err = new Error("foo");
function b() {
	return Promise.reject(err);
}
function a() {
	return b();
}
const foo = a();
//foo.then(()=>{});

