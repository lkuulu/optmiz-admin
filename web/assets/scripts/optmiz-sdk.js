const APIBaseUrl = 'http://api.optmiz.me/';
const ImageAPIUrl = APIBaseUrl + 'image/';
const FiletreeAPIUrl = APIBaseUrl + 'filetree';
const FileAPIUrl = APIBaseUrl + 'file';
const UserAPIUrl = 'http://user.optmiz.me/';
const ImageBaseDomainUrl = "http://image.optmiz.me/";

let test;
if (!window.console) {
    window.console = {}
}
if (typeof window.console.log !== "function") {
    window.console.log = function () {
    }
}
if (typeof window.console.warn !== "function") {
    window.console.warn = function () {
    }
}

doAjaxRequest = (requestObject) => {

    if ((typeof(requestObject.data) === 'object') && (typeof(requestObject.data.entries) === 'function')) {
        // for (var pair of requestObject.data.entries()) {
        //     console.log(pair[0] + ', ' + pair[1]);
        // }
    }

    // console.log({
    //     url: requestObject.url,
    //     cache: false,
    //     contentType: (requestObject.contentType !== null) ? requestObject.contentType : 'application/json',
    //     type: requestObject.verb,
    //     data: JSON.stringify(requestObject.data),
    //     cache: (typeof(requestObject.cache)=== "boolean") ? requestObject.cache : false,
    //     processData: (typeof(requestObject.processData) === "boolean") ?  requestObject.processData : true,
    //     dataType: (requestObject.dataType) ? requestObject.dataType : 'text',
    //     beforeSend: function (xhr) {
    //         if (requestObject.authorization) {
    //             xhr.setRequestHeader("Authorization", requestObject.authorization);
    //         }
    //     }
    // });

    $.ajax({
        url: requestObject.url,
        cache: false,
        contentType: (requestObject.contentType !== null) ? requestObject.contentType : 'application/json',
        type: requestObject.verb,
        data: (requestObject.contentType === 'application/json') ? JSON.stringify(requestObject.data) : requestObject.data,
        cache: (typeof(requestObject.cache) === "boolean") ? requestObject.cache : false,
        processData: (typeof(requestObject.processData) === "boolean") ? requestObject.processData : true,
        dataType: (requestObject.dataType) ? requestObject.dataType : 'text',
        beforeSend: function (xhr) {
            if (requestObject.authorization) {
                xhr.setRequestHeader("Authorization", requestObject.authorization);
            }
        }
    }).done(function (result) {
        if (requestObject.callback) {
            requestObject.callback(result, requestObject)
        }
    }).fail(function (jqXHR, status, error) {
        console.log(status);
        if (requestObject.error) {
            requestObject.error(jqXHR.responseText, requestObject.data, status)
        }
    });
};

const AjaxWrapper = (baseUrl = '', callbacksFunctions = {}) => {
    let token = null;
    let apikey = null;
    let callbacks = {post: null, get: null, delete: null, put: null, patch: null, error: null};
    callbacks = Object.assign(callbacks, callbacksFunctions);
    return {
        set baseUrl(value) {
            baseUrl = value;
        },
        set callbacks(value) {
            callbacks = Object.assign(callbacks, value);
        },
        set apikey(value) {
            apikey = value;
        },
        set authorization(value) {
            token = value;
        },
        post: (resource, dataObject, extra = {contentType: 'application/json'}) => {
            // append apikey to formData
            if (typeof(dataObject.append) === 'function') {
                dataObject.append('apikey', apikey);

                // for (var pair of dataObject.entries()) {
                //     console.log(pair[0]+ ', ' + pair[1]);
                // }

            }
            doAjaxRequest(Object.assign({
                verb: 'post',
                url: baseUrl + resource,
                data: dataObject,
                callback: callbacks.post,
                error: callbacks.error,
                authorization: token
            }, extra))
        },
        get: (resource, dataObject) => {
            doAjaxRequest(Object.assign({
                verb: 'get',
                url: baseUrl + resource,
                //data: Object.assign(dataObject, {apikey: apikey}),
                callback: callbacks.get,
                error: callbacks.error,
                authorization: token
            }))
        },
        delete: (resource, dataObject, extra = {contentType: 'application/json'}) => {
            return doAjaxRequest(Object.assign({
                verb: 'delete',
                url: baseUrl + resource,
                //extra,
                //contentType: extra.contentType,
                data: Object.assign(dataObject, {apikey: apikey}),
                callback: callbacks.delete,
                error: callbacks.error,
                authorization: token
            }, extra))
        },
        patch: (resource, dataObject, extra = {contentType: 'application/json'}) => {
            return doAjaxRequest(Object.assign({
                verb: 'patch',
                url: baseUrl + resource,
                data: Object.assign(dataObject, {apikey: apikey}),
                //extra,
                //contentType: extra.contentType,
                callback: callbacks.patch,
                error: callbacks.error,
                authorization: token
            }, extra))
        },
        put: (resource, dataObject, extra = {contentType: 'application/json'}) => {
            return doAjaxRequest(Object.assign({
                verb: 'put',
                url: baseUrl + resource,
                data: Object.assign(dataObject, {apikey: apikey}),
                //extra,
                //contentType: extra.contentType,
                callback: callbacks.put,
                error: callbacks.error,
                authorization: token
            }, extra))
        }
    }
};

const FiletreeAPI = () => {
    let connector = AjaxWrapper(FiletreeAPIUrl);
    let callbacks = {cbLoad: null};
    let options = {onlyFolders: true, onlyFiles: false, multiSelect: false};
    let expandedFolders = [];
    return {
        set connectorUrl(value) {
            connector.baseUrl = value;
        },
        set callbacks(value) {
            callbacks = Object.assign(callbacks, value);
        },
        set apikey(value) {
            connector.apikey = value;
        },
        set token(value) {
            connector.authorization = value;
        },
        set options(value) {
            options = Object.assign(options, value);
        },
        get options() {
            return options;
        },
        set expandedFolders(value) {
            expandedFolders = value;
        },
        load: (dir, onLoaded = null) => {
            if (onLoaded) {
                callbacks.cbLoad = onLoaded;
            }
            connector.callbacks = {post: callbacks.cbLoad};
            connector.post('/', Object.assign({dir: dir}, options, expandedFolders), {contentType: 'application/json'}); //{contentType:'application/x-www-form-urlencoded'});
        },
    }
};

const FileAPI = () => {
    let connector = AjaxWrapper(FileAPIUrl);
    let callbacks = {cbDelete: null, cbMove: null, cbLoad: null, cbRename: null, cbCreate: null};
    return {
        set connectorUrl(value) {
            connector.baseUrl = value;
        },
        set callbacks(value) {
            callbacks = Object.assign(callbacks, value);
        },
        set token(value) {
            connector.authorization = value;
        },
        set apikey(value) {
            connector.apikey = value;
        },
        delete: (folder, onDeleted = null) => {
            if (onDeleted) {
                callbacks.cbDelete = onDeleted;
            }
            connector.callbacks = {delete: callbacks.cbDelete};
            connector.delete(folder, {folder: folder});
        },
        load: (source, onLoaded = null) => {
            if (onLoaded) {
                callbacks.cbLoad = onLoaded;
            }
            connector.callbacks = {get: callbacks.cbLoad};
            connector.get(source, {source: source}, {contentType: 'application/json'});
        },
        move: (source, destination, onMoved = null) => {
            if (onMoved) {
                callbacks.cbMove = onMoved;
            }
            connector.callbacks = {put: callbacks.cbMove};
            connector.put(source, {source: source, destination: destination}, {contentType: 'application/json'});
        },
        create: (currentFolder, newFolder, onCreated = null) => {
            if (onCreated) {
                callbacks.cbCreate = onCreated;
            }
            connector.callbacks = {post: callbacks.cbCreate};
            connector.post('/', {dir: currentFolder, newfolder: newFolder});
        },
    }
};


const File = () => {
    let type = 'file';
    let path = null;
    let timestamp = null;
    let size = null;
    let dirname = null;
    let basename = null;
    let extension = null;
    let filename = null;
    return {
        set setFile(value) {
            type = value.type || type;
            path = value.path || path;
            timestamp = value.timestamp || timestamp;
            size = value.size || size;
            dirname = value.dirname || dirname;
            basename = value.basename || basename;
            extension = value.extension || extension;
            filename = value.filename || filename;
        },
        toJson: () => {
            return {
                type: type,
                path: path,
                timestamp: timestamp,
                size: size,
                dirname: dirname,
                basename: basename,
                extension: extension,
                filename: filename,
            }
        }
    }
};

const FileImage = () => {
    let crops = {};
    let file = File();
    let path = null;
    let poi = null;
    let size = [];
    return {
        set crops(value) {
            crops = value;
        },
        set file(value) {
            file.setFile = value;
        },
        set path(value) {
            path = value;
        },
        set poi(value) {
            poi = value;
        },
        set size(value) {
            size = value;
        },
        get size() {
            return size;
        },
        get poi() {
            return poi;
        },
        get path() {
            return path;
        },
        get crops() {
            return crops;
        },
        get file() {
            return file;
        },
        toJson: () => {
            return {
                crops: crops,
                file: file.toJson(),
                path: path,
                poi: poi,
                size: size
            }
        }
    }
};

const Lengths = (value) => {
    let width = value.width;
    let height = value.height;
    return {
        set width(value) {
            width = value;
        },
        set height(value) {
            height = value;
        },
        get width() {
            return width;
        },
        get height() {
            return height;
        },
        toJson() {
            return {width: width, height: height};
        }
    }
};

const Ratio = (value) => {
    let name = value.name;
    let lengths = Lengths({width: value.width, height: value.height});
    return {
        get name() {
            return name;
        },
        set width(value) {
            lengths.width = value;
        },
        set height(value) {
            lengths.height = value;
        },
        set name(value) {
            name = value;
        },
        get lenghts() {
            return lengths;
        },
        toJson() {
            return Object.assign({}, {name: name}, lengths.toJson())
        }

    }
};

const Repository = (value) => {
    let name = value.name || null;
    let ratios = [];
    return {
        set repository(value) {
            repository = value;
        },
        set ratios(value) {
            ratios = value;
        },
        updateRatio(name, width, height) {
            ratios.forEach(function (ratio) {
                let key = ratio.name;
                if (key === name) {
                    ratio.height = height;
                    ratio.width = width;
                }
            });
        },
        addRatio(name, width, height) {
            if (!ratios[name]) {
                ratios.push(Ratio({name: name, width: width, height: height}));
                return ratios[name];
            } else
                return false
        },
        get name() {
            return name;
        },
        get ratios() {
            return ratios;
        },
        getRatio(name) {
            let result = false;
            ratios.forEach(function (ratio) {
                if (ratio.name === name) {
                    result = ratio;
                }
            });
            return result;
        },
        toJson() {
            let jsonRatio = {};
            ratios.forEach(function (ratio) {
                let key = ratio.name;
                jsonRatio[key] = ratio.toJson();
            });
            return Object.assign({}, {name: name}, {ratios: jsonRatio});
        }
    }
};


const User = (apikey) => {
    let username;
    let password;
    let company;
    let role;
    let repository;
    let token;
    let created_at;
    let connected = false;
    let connector = AjaxWrapper(UserAPIUrl);
    let onLogin = null;
    let onError = null;
    let updateTokenCallback = null;
    let afterUpdate = (result) => {
        console.log('Update OK');
    };
    let errorLogin = (result) => {
        result = JSON.parse(result);
        if (onError != null) {
            onError(result);
        }

    };
    let afterLogin = (result) => {
        result = JSON.parse(result);
        token = result.token;
        repository = Repository({name: result.profile.repository.name});
        role = result.profile.role;
        company = result.profile.company;
        created_at = result.profile.created_at;
        connected = true;
        result.profile.repository.ratio.forEach(function (ratio) {
            repository.addRatio(ratio.name, ratio.width, ratio.height);
        });
        localStorage.setItem('OPTMIZ.USER', JSON.stringify(toJson()));
        if (updateTokenCallback != null) {
            updateTokenCallback(toJson());
        }
        if (onLogin != null) {
            onLogin(toJson(), result.result);
        }
    };

    let toJson = () => {
        return {
            connected: connected,
            apikey: apikey,
            username: username,
            password: password,
            company: company,
            role: role,
            created_at: created_at,
            repository: repository.toJson(),
            token: token
        }
    };
    return {
        get apikey() {
            return apikey;
        },
        get username() {
            return username;
        },
        get created_at() {
            return created_at;
        },
        get password() {
            return password;
        },
        get company() {
            return company;
        },
        get role() {
            return role;
        },
        get repository() {
            return repository;
        },
        get token() {
            return token;
        },
        get connected() {
            return connected;
        },
        set username(value) {
            username = value;
        },
        set password(value) {
            password = value;
        },
        set company(value) {
            company = value;
        },
        set role(value) {
            role = value;
        },
        set repository(value) {
            repository = value;
        },
        set token(value) {
            token = value;
        },
        set updateTokenCallback(value) {
            updateTokenCallback = value;
        },
        imageBaseDomain() {
            return ImageBaseDomainUrl + repository.name + '/';
        },
        loadFromStorage() {
            userObject = localStorage.getItem('OPTMIZ.USER') && JSON.parse(localStorage.getItem('OPTMIZ.USER'));
            //console.log('Localstorage', userObject);
            connected = userObject && userObject.connected;
            if (connected) {
                apikey = userObject.apikey;
                username = userObject.username;
                password = userObject.password;
                company = userObject.company;
                role = userObject.role;
                created_at = created_at;
                token = userObject.token;
                repository = Repository({name: userObject.repository.name});
                for (let ratio in userObject.repository.ratios) {
                    repository.addRatio(userObject.repository.ratios[ratio].name, userObject.repository.ratios[ratio].width, userObject.repository.ratios[ratio].height);
                }
                ;
                if (updateTokenCallback != null) {
                    updateTokenCallback(toJson());
                }

            }
            return connected;
        },
        login(credentials, onLoginCallBack, onErrorCallback) {
            onLogin = onLoginCallBack;
            onError = onErrorCallback;
            connector.callbacks = {post: afterLogin, error: errorLogin};
            username = credentials.username;
            password = credentials.password;
            connector.post('login', {
                username: credentials.username,
                password: credentials.password,
                apikey: apikey
            }, {contentType: 'application/x-www-form-urlencoded'});
        },
        update() {
            connector.authorization = "Bearer " + token;
            connector.callbacks = {put: afterUpdate};
            connector.put('profile/' + username, toJson(), {contentType: 'application/x-www-form-urlencoded'});
        },
        logout() {
            connected = false;
            username = null;
            password = null;
            company = null;
            role = null;
            created_at = null;
            repository = null;
            token = null;
            connector.authorization = null;
            localStorage.setItem('OPTMIZ.USER', null);
        },
        initUser(value) {
            username = value.username || null;
            password = value.password || null;
            company = value.company || null;
            role = value.role || null;
            repository = value.repository || null;
            token = value.token;
        },
        toJson() {
            return toJson();
        }
    }
};

const ImageAPI = () => {
    let entryPoint = ImageAPIUrl;
    let connector = AjaxWrapper(entryPoint);
    let callbacks = {cbDelete: null, cbMove: null, cbRename: null, cbCreate: null, cbUpload: null, cbUpdate: null};
    return {
        set connectorUrl(value) {
            connector.baseUrl = value;
        },
        set callbacks(value) {
            callbacks = Object.assign(callbacks, value);
        },
        set apikey(value) {
            connector.apikey = value;
        },
        set token(value) {
            connector.authorization = value;
        },
        get entryPoint() {
            return entryPoint;
        },
        //deleteFile
        delete: (file, folder, onDeleted = null) => {
            if (onDeleted) {
                callbacks.cbDelete = onDeleted;
            }
            connector.callbacks = {delete: callbacks.cbDelete};
            connector.delete(file.path, {folder: folder, file: file.path});
        },
        //saveImage
        update: (fileObject, onUpdated = null) => {
            if (onUpdated) {
                callbacks.cbUpdate = onUpdated;
            }
            connector.callbacks = {patch: callbacks.cbUpdate};
            connector.patch(fileObject.path, fileObject);
        },
        //LoadImage
        load: (file, fileObject, onLoaded = null) => {
            if (onLoaded) {
                callbacks.cbLoadImage = onLoaded;
            }
            connector.callbacks = {get: callbacks.cbLoadImage};
            connector.get(file, fileObject);
        },
        //saveNewImage
        upload: (file, folder, fileObject, onUploaded = null) => {
            if (onUploaded) {
                callbacks.cbUpload = onUploaded;
            }
            let formData = new FormData();
            formData.append('file', file);
            formData.append('dist_dir', folder);
            formData.append('fileObject', encodeURI(JSON.stringify(fileObject)));
            connector.callbacks = {post: callbacks.cbUpload};
            connector.post('', formData, {contentType: false, dataType: 'HTML', cache: false, processData: false});
        }
    }
};

const optmiz = () => {
    let asyncPattern = (/async="true"/),
        //mySelf = document.currentScript,
        params = [],
        isAsync = false,
        scriptNode,
        ENV = {},
        mySelf = (/^https?:\/\/.*?optmiz-sdk.*?\.js.*?$/),
        scripts = document.getElementsByTagName("script"),
        apikey = null;

    scriptNode = "";
    let currentScript;
    for (let i = 0; i < scripts.length; i++) {
        currentScript = scripts[i];
        if (!mySelf.test(currentScript.src)) {
            continue
        }
        if (asyncPattern.test(currentScript.src)) {
            isAsync = true
        }
        try {
            scriptNode = currentScript.innerHTML;
        } catch (error) {
            try {
                scriptNode = currentScript.text
            } catch (error) {
            }
        }
    }

    params = JSON.parse(scriptNode);
    params.async = isAsync;
    apikey = params.apikey;

    let testcb = function (result, query) {
        console.log('enter callback');
        console.log(result, query);
    };

    let APIFile;
    let APIImage;
    let APIFiletree;
    let APIUser;

    let updateToken = (user) => {
        console.log('Update API token for credentials');
        APIFile.token = "Bearer " + user.token;
        APIFile.apikey = user.apikey;
        APIImage.token = "Bearer " + user.token;
        APIImage.apikey = user.apikey;
        APIFiletree.token = "Bearer " + user.token;
        APIFiletree.apikey = user.apikey;
    };

    let beforeSend = (xhr) => {
        console.log('call to before Send');
        if (APIUser.toJson().token) {
            xhr.setRequestHeader("Authorization", "Bearer " + APIUser.toJson().token);
        }
    };

    let init = (overrideParams) => {
        let key;
        overrideParams = overrideParams || {};
        for (key in overrideParams) {
            if (overrideParams.hasOwnProperty(key)) {
                params[key] = overrideParams[key];
            }
        }

        if (params.apikey) {
            APIFile = FileAPI(apikey); //ajax('http://api.optmiz.me/file');
            APIFile.callbacks = {
                cbDelete: this.testcb,
                cbMove: this.testcb,
                cbRename: this.testcb,
                cbCreate: this.testcb
            };
            APIImage = ImageAPI();
            APIFiletree = FiletreeAPI();

            API = () => {
                return Object.assign({}, {filetree: APIFiletree}, {image: APIImage}, {file: APIFile}, {onBeforeSend: beforeSend});
            };
            API().file.token = params.token;

            // last : user
            APIUser = User(params.apikey);
            APIUser.updateTokenCallback = updateToken;

            // fire onLoad event
            if (params.onLoad && (typeof window[params.onLoad] === "function")) {
                window[params.onLoad]();
            } else if (params.onLoad && (params.onLoad !== null)) {
                this.warn("onLoad triggered function not found!")
            }
        } else
            this.warn("apikey not found!")
    };

    return {
        init: (overrideParams) => {
            init(overrideParams);
        },
        API: () => {
            return Object.assign({}, {filetree: APIFiletree}, {image: APIImage}, {file: APIFile}, {onBeforeSend: beforeSend});
        },
        USER: () => {
            return APIUser;
        },
        warn: (message) => {
            if (!ENV.suppressWarnings) {
                console.warn(message)
            }
        }
    }
};


// repo = Repository({name: 'testRepoName'});
// repo.addRatio('square', 1, 1);
// repo.addRatio('16x9', 16, 9);
// console.log(repo.addRatio('24x9', 24, 9));
// console.log(repo.toJson());
// console.log(repo.ratios());
