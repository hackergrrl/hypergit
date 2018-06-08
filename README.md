# hypergit

> CLI for managing peer-to-peer git repositories

## Just another git remote

hypergit wants to be a special git remote, like `https://...` or `ssh://...`,
except instead of pointing to a specific (centralized) server somewhere on the
internet, it points to a peer-to-peer-friendly database on your own computer.
When you 'push' to a hypergit remote, you're writing your changes to a local
hyperdb, which mirrors how git would lay itself out on the filesystem.

## P2P sync & works offline

hyperdb's special power is the ability to sync itself with other peers over the
internet.

Creating a hypergit repo (hypergit create) adds a remote called swarm to your
.git/config, and creates a new unique id (it's actually a public key) that
identifies that new remote. Something like
`hypergit://ccc0940b5b13937e5b32ed48b412803d2d70caa18c3ec7ba385c77c204d70c94`.
When someone runs `git clone hypergit://...` or `hypergit seed`, the program
will connect to a distributed hash table and find other peers who are interested
in that identifier. The ID is hashed before you look for it, so users couldn't
discover the repo without knowing the original key. Connections are opened to
those peers and you exchange hyperdb state so that you both end up with the same
resulting state.

From here you could do a git fetch swarm to pull down those latest changes. The
cool thing is that since the remote lives on your local filesystem, you can do
push and pull and fetch even while offline, and your changes will sync to the
rest of the peers involved in this repo once you're online again.

