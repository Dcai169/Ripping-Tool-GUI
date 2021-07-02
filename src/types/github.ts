export interface GitHubAsset {
    url: string,
    id: number,
    node_id: string,
    name: string,
    label: any,
    uploader: GitHubUser,
    content_type: string,
    state: string,
    size: number,
    download_count: number,
    created_at: string,
    updated_at: string,
    browser_download_url: string
}

interface GitHubUser {
    login: string,
    id: number,
    node_id: string,
    avatar_url: string,
    gravatar_url: string,
    url: string,
    html_url: string,
    followers_url: string,
    following_url: string,
    gists_url: string,
    starred_url: string,
    subscriptions_url: string,
    organization_url: string, 
    repos_url: string,
    events_url: string,
    received_events_url: string,
    type: string,
    site_admin: boolean
}