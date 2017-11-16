function renderUser(user) {
    let result = '<div class="username">'+user.username+'</div>'
    result += '<div class="company">'+user.company+'</div>'
    result += '<button class="logout" onclick="logout()">logout</button>'

    return result;
}
