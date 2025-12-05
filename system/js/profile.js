document.addEventListener("DOMContentLoaded", () => {
const pfp = document.getElementById("pfp");
const defaultPic = "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/icons/profile.png";
const currentUser = localStorage.getItem("currentUser");
if (!currentUser) {
  pfp.src = defaultPic;
  return;
}
const userData = JSON.parse(localStorage.getItem("user_" + currentUser) || "{}");
const profileData = JSON.parse(localStorage.getItem("profile_" + currentUser) || "{}");
const userPic = profileData.pic || defaultPic;
pfp.src = userPic;
const cachedPreview = {
  username: userData.username || profileData.nickname || currentUser,
  pic: userPic
};
localStorage.setItem("preview_" + currentUser, JSON.stringify(cachedPreview));
});
