# hypergit

> CLI for managing peer-to-peer git repositories

## Usage

```
USAGE: hypergit [--version] [command] [--help]

Commands:
  create        Create a new hypergit repo.

  auth KEY      Grant write access to a user identified by KEY.

  seed          Actively share this repo with other peers.

  id            Print your local repo's key. Users with write access can 'auth'
                this to grant KEY write access too.

  web           Start hosting local web frontend.

```

The `hypergit` cli lets you manage hypergit remotes. In order to be able to `git
clone hypergit://...` URLs, you'll need the `git-remote-hypergit` helper:

```
npm install -g git-remote-hypergit
```

**TODO**: install this command with the `hypergit` command! (PRs welcome)

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
rest of the peers involved in this repo once you're online again. You can even
peer with just other users on the same local network as you and collaborate in
offline environments.

## Data lives on the peers

This approach differs from federation, where users pick from a set of servers to
host their git repositories. With hypergit all of the data lives on peers
directly, so everyone with a laptop is a first-class citizen, and
doesn't have to choose between hosted services that could go down at some point.
By using hypergit seed you can, not unlike bittorrent, re-host git repos you
like on servers and provide them greater availability.)

## What hypergit isn't

This isn't a github replacement. hypergit wants to be a powerful primitive that
*enables* social peer-to-peer coding. There are many ways to do coding with
other humans, and heavy opinions on that don't feel like they ought to be tied
in with the lower level pieces.

