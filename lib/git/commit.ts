export interface Commit {
	sha: string;
	message: string;
}

export interface CommitWithBody extends Commit {
	body: string;
}
