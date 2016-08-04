app.service('pathService', function () {

    this.AddPath = function (paths, newpath) {
        var index = paths.findIndex(x => x.pathName.toLowerCase() == newpath.toLowerCase());
        if (index == -1) {
            paths.push({
                'pathName': newpath,
                methods: []
            })
        }
        else {
            alert('Duplicate Path');
        }
        return paths;
    };

    this.DeletePath = function (paths, deletePath) { };

    this.AddMethodForPath = function (paths, index, method, counter) {
        debugger;

    };
});