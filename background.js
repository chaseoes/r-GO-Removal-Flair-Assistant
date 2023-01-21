chrome.runtime.onMessage.addListener(
    async function(request) {
        if (request.contentScriptQuery == "editFlair") {
            const url = new URL('https://www.reddit.com/r/globaloffensive/api/selectflair');
            url.search = new URLSearchParams({
                api_type: 'json',
                flair_template_id: request.flairTemplateID,
                link: request.thing,
                text: request.text,
                uh: request.mod
            });

            fetch(url, {method: 'POST'})
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Request Error');
                    }
                })
                .catch(function(error) {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    },
                    function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            status: 'error',
                            func: 'editFlair',
                            msg: error.message
                        });
                    });
                });

            return true;
        }
        else if (request.contentScriptQuery === 'removeWithReason') {
            const removeUrl = new URL('https://www.reddit.com/r/globaloffensive/api/remove');
            const commentUrl = new URL('https://www.reddit.com/r/globaloffensive/api/comment');
            const distinguishUrl = new URL('https://www.reddit.com/r/globaloffensive/api/distinguish/yes');
            removeUrl.search = new URLSearchParams({
                api_type: 'json',
                uh: request.mod,
                id: request.thing,
                spam: false
            });
            commentUrl.search = new URLSearchParams({
                api_type: 'json',
                parent: request.thing,
                text: request.text,
                uh: request.mod
            });

            try {
                const removeResp = await (await fetch(removeUrl, { method: 'POST' })).json();
                const commentResp = await (await fetch(commentUrl, { method: 'POST' })).json();
                distinguishUrl.search = new URLSearchParams({
                    id: commentResp.json.data.things[0].data.id,
                    uh: request.mod,
                    sticky: true
                });
                if (request.distinguish) {
                    const distinguishResp = await (await fetch(distinguishUrl, { method: 'POST' })).json();
                    if (!request.win) return;
                    chrome.tabs.query({
                        active: true, 
                        currentWindow: true
                    }, 
                    function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            status: 'success'
                        });
                    });
                }
            }
            catch(e) {
                // handle errors
                chrome.tabs.query({
                    active: true, 
                    currentWindow: true
                }, 
                function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        status: 'error',
                        err: 'The previous request encountered an error: ',
                        msg: e.message
                    });
                });
            }
            return true;
        }
    }
);