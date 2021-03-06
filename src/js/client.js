/* Creating the Post entity
 * ########################################################################################### */
function Post(id, title, content, author, unix_created_at) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.author = author;
    this.date = unix_created_at;
}

/*End Post Entity code
 * ###########################################################################################  */


/* Creating Post Collection
 * ########################################################################################### */
function PostCollection() {
    this.posts = [];
}

PostCollection.prototype.getAllPosts = function () {
    return this.posts;
};

PostCollection.prototype.setPosts = function (postsList) {
    var length = postsList.length;
    for (var i = 0; i < length; i++) {
        var post = new Post(postsList[i].id, postsList[i].title, postsList[i].content, postsList[i].author, postsList[i].unix_created_at);
        this.posts.push(post);
    }
    viewController.setTablePosts();
};

PostCollection.prototype.addPost = function (data) {
    var post = new Post(data.id, data.title, data.content, data.author);
    this.posts.push(post);
    viewController.addRow(post);
};

PostCollection.prototype.clearPosts = function () {
    this.posts = [];
};

PostCollection.prototype.getPostById = function (id) {
    return $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
};

PostCollection.prototype.updatePost = function (id, data) {
    var post = $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
    post.title = data.title;
    post.content = data.content;
    post.author = data.author;
};

PostCollection.prototype.deletePost = function (id) {
    this.posts = $.grep(this.posts, function (post) {
        return post.id != id;
    });
};
/* End PostCollection Code
 * ########################################################################################### */


/* PostController Code
 * ########################################################################################### */
function PostController() {
    this.getPosts = function () {
        this.url = BASE_API_URL + '?offset=' + offset + sorting;
        if (sorting === undefined){
            this.url = BASE_API_URL + '?offset=' + offset
        }
        $.ajax({
            url: this.url,
            type: 'GET',
            success: function (data) {
                var posts = data.response;
                postTotal = data.total;
                postCollection.setPosts(posts);
            },
            error: function (xhr, resp, text) {
                $('.btnMore').html('Thats All').prop("disabled", true);
            }
        })
    };


    this.addPost = function (data) {
        $.ajax({
            url: BASE_API_URL + '/create',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (data) {
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
                postCollection.clearPosts();
                postController.getPosts();
                setTimeout(function () {
                    Helper.currentTotalChecker();
                }, 500);
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.updatePost = function (id, data) {
        $.ajax({
            url: BASE_API_URL + '/edit/' + id,
            type: 'PUT',
            dataType: "JSON",
            data: JSON.stringify(data),
            success: function () {
                postCollection.updatePost(id, data);
                var $tr = $("tr[data-id='" + id + "']");
                $tr.children('td').eq(1).html(data.title);
                $tr.children('td').eq(2).html(data.content);
                $tr.children('td').eq(3).html(data.author);
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.deletePost = function (id) {
        var html_tr = "tr[data-id='" + id + "']";
        $.ajax({
            url: BASE_API_URL + '/delete/' + id,
            type: 'DELETE',
            dataType: 'json',
            success: function () {
                postCollection.deletePost(id);
                $(html_tr).fadeOut(400, function () {
                    $(html_tr).remove();
                })
            },
            error: function () {
                alert('Deleting of post #' + id + ' failed');
            }
        });
    }
}

/* End PostController Code
 * ########################################################################################### */


/* Event Listeners
 * ########################################################################################### */

$('#postForm').on('submit', function (event) {
    event.preventDefault();
    var id = parseInt($(this).data('id'));
    if (id === 0) {
        postController.addPost($(this).formSerialize());
    } else {
        postController.updatePost(id, $(this).formSerialize());
        $(this).data('id', 0);
    }
});

//delete event listener
$(document).on('click', '.delBtn', function () {
    var id = $(this).closest("tr").data('id');
    postController.deletePost(id);
});

//edit event listener
$(document).on('click', '.editBtn', function () {
    var id = $(this).closest("tr").data('id');
    var post = postCollection.getPostById(id);
    $('#title').val(post.title);
    $('#content').val(post.content);
    $('#author').val(post.author);
    $('#postForm').data('id', id);
    $('#postFormModal').modal('show');
});


//lazy load event listener
$('.btnMore').on('click', function () {
    Helper.lazyLoad();
});

//generate data via PHP Faker
$('.btnGenerate').on('click', function () {
    Helper.generatePosts();
});

//Sort ASC event listener
$('.glyphicon-sort-by-attributes').on('click', function () {
    $('.btnMore').html('More').prop("disabled", false);
    offset = 0;
    var column = $(this).closest('th').data('sort');
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    sorting = '&column=' + column + '&option=ASC';
    postCollection.clearPosts();
    postController.getPosts();
});

//Sort DESC event listener
$('.glyphicon-sort-by-attributes-alt').on('click', function () {
    $('.btnMore').html('More').prop("disabled", false);
    offset = 0;
    var column = $(this).closest('th').data('sort');
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    sorting = '&column=' + column + '&option=DESC';
    postCollection.clearPosts();
    postController.getPosts();
});
/* End Event Listeners
 * ########################################################################################### */


/* ViewController Code
 * ########################################################################################### */
function ViewController() {
    this.setTablePosts = function () {
        var posts = postCollection.getAllPosts();
        var length = posts.length;
        rowCount = length;
        $('#postsTable tbody').empty();
        for (var i = 0; i < length; i++) {
            $('#postsTable tbody').append(
                '<tr data-id=' + posts[i].id + '>' +
                '<td class="date">' + Helper.timeDiff(posts[i].date) + '</td>' +
                '<td>' + posts[i].title + '</td>' +
                '<td>' + posts[i].content + '</td>' +
                '<td>' + posts[i].author + '</td>' +
                '<td class="text-center cell-option">' +

                //button for edit action
                '<button class="btn btn-info btn-xs editBtn ">' +
                '<span class="glyphicon glyphicon-edit"></span></button>' +

                // button for delete action
                '<button class="btn btn-danger btn-xs delBtn ">' +
                '<span class="glyphicon glyphicon-remove-sign">' +
                '</span></button></td></tr>'
            );
        }
    };
}

/* End ViewController Code
 * ########################################################################################### */


/* Helpers Code
 * ########################################################################################### */
function Helper() {
    this.formSerialize = function ($) {
        $.fn.formSerialize = function () {
            var serialized = {};
            var array = this.serializeArray();
            $.each(array, function () {
                if (serialized[this.name]) {
                    if (!serialized[this.name].push) {
                        serialized[this.name] = [serialized[this.name]];
                    }
                    serialized[this.name].push(this.value || '');
                } else {
                    serialized[this.name] = this.value || '';
                }
            });
            return serialized;
        };
    }(jQuery);

    this.generatePosts = function () {
        $.ajax({
            url: FAKER_URL,
            type: 'GET',
            success: function () {
                postCollection.clearPosts();
                location.reload();
                postController.getPosts();
                alert('20 new data items was generated via Faker!')
            },
            error: function () {
                alert('an error occurred while generating data')
            }
        })
    };



    this.lazyLoad = function () {
        $('.glyphicon').removeClass("glyphicon-active");
        if (offset >= postTotal) {
            offset = postTotal;
        } else {
            offset += 5;
        }
        postController.getPosts();
    };

    /*returns difference between current date
        and post creation date */
    this.timeDiff = function (date) {
        return moment().from(date * 1000)
    };

    //check difference between dates with interval
    this.dateChecker = function () {
        setInterval(function () {
            $('.date').each(function () {
                var id = $(this).parent('tr').data('id');
                var post = postCollection.getPostById(id);
                $(this).html(Helper.timeDiff(post.date));
            })
        }, 5000);
    };

}

/* End Helpers Code
 * ########################################################################################### */


var postController = new PostController();
var postCollection = new PostCollection();
var viewController = new ViewController();
var Helper = new Helper();
var rowCount;
var postTotal;
var sorting;

var limit = 10;
var offset = 0;
const BASE_API_URL = 'http://dcodeit.net/dmitry.kalenyuk/projects/rest-api-codeit/public/posts';
const FAKER_URL = 'http://dcodeit.net/dmitry.kalenyuk/practice/faker/';
postController.getPosts();
Helper.dateChecker();


