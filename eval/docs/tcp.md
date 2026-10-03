# The Transmission Control Protocol (TCP)

## What TCP does

The Transmission Control Protocol, or TCP, is one of the main protocols of the Internet. It sits on top of the Internet Protocol (IP). IP moves single packets from one machine to another but makes no promises: packets can be lost, copied, or arrive out of order. TCP hides these problems from applications. It gives two programs a reliable, ordered stream of bytes in both directions. Web pages, email and file transfers have traditionally run over TCP.

The ideas behind TCP were first set out by Vint Cerf and Bob Kahn in a 1974 paper titled "A Protocol for Packet Network Intercommunication". The classic specification is RFC 793, edited by Jon Postel and published in September 1981. After four decades of fixes spread over many documents, RFC 793 was replaced in August 2022 by RFC 9293, which gathers the accumulated changes into one text.

## Ports and connections

A TCP connection is identified by four values: the source IP address, the source port, the destination IP address and the destination port. A port is a 16-bit number, so ports run from 0 to 65535. Ports 0 to 1023 are called well-known ports and are set aside for standard services; for example, HTTP uses port 80, HTTPS uses port 443 and SSH uses port 22. For the client side of a connection, the operating system picks a temporary port. The range that IANA suggests for these ephemeral ports is 49152 to 65535.

## The segment header

TCP sends data in units called segments. Each segment starts with a header that is at least 20 bytes long and can grow to 60 bytes when options are added. The header holds, among other things:

- the source port and destination port, 16 bits each;
- a 32-bit sequence number, which gives the position of the first data byte of the segment in the stream;
- a 32-bit acknowledgment number, which names the next byte the sender of the segment expects to receive;
- a 4-bit data offset field, which gives the length of the header in 32-bit words;
- control flags, including SYN, ACK, FIN, RST, PSH and URG;
- a 16-bit window field, which says how many more bytes the receiver is willing to accept;
- a 16-bit checksum.

The checksum covers the header, the data, and a so-called pseudo-header made from the IP addresses, the protocol number and the segment length. Including the pseudo-header guards against segments that were delivered to the wrong host.

## Opening a connection: the three-way handshake

A connection is opened with three segments. The client sends a segment with the SYN flag set and a starting sequence number of its own choosing. The server answers with a segment that has both SYN and ACK set, carrying its own starting sequence number and acknowledging the client's. The client then sends an ACK, and data can flow. The starting sequence numbers are picked to be hard to guess, so that an attacker who cannot see the traffic cannot easily inject forged segments.

During the handshake each side also announces its maximum segment size (MSS), the largest block of data it is willing to receive in one segment. If a side does not send this option, the other side must assume the default of 536 bytes for IPv4. On an Ethernet network the usual value is 1460 bytes, which is the 1500-byte Ethernet payload minus 20 bytes of IP header and 20 bytes of TCP header.

The handshake costs one full round trip before any data can be sent. TCP Fast Open, described in RFC 7413, lets a client that has talked to a server before put data in its very first SYN segment by presenting a cookie the server issued earlier.

## Closing a connection

Each direction of a connection is closed on its own. A side that has no more data to send transmits a segment with the FIN flag, and the other side acknowledges it. A normal close therefore takes four segments. The RST flag, in contrast, ends a connection at once and is used when something has gone wrong, for example when a segment arrives for a connection that does not exist.

The side that closes first does not forget the connection immediately. It waits in a state called TIME-WAIT for twice the maximum segment lifetime, so that any stray segments from the old connection die out before the same pair of ports can be used again. RFC 793 set the maximum segment lifetime at 2 minutes, though many systems use a shorter value in practice.

## Reliability

Every byte in the stream has a sequence number, and the receiver sends acknowledgments saying which bytes have arrived. If the sender gets no acknowledgment for a segment within a time limit called the retransmission timeout, it sends the segment again. The timeout is worked out from measurements of the round-trip time. RFC 6298 gives the standard formula and says the timeout should not be less than 1 second. Karn's algorithm says that round-trip samples must not be taken from segments that were retransmitted, since it is not possible to tell which copy an acknowledgment belongs to.

Plain acknowledgments are cumulative: they only say "I have everything up to this byte." With selective acknowledgment (SACK), defined in RFC 2018, the receiver can also list blocks of data that arrived after a gap, so the sender needs to resend only the missing pieces.

## Flow control

Flow control keeps a fast sender from overrunning a slow receiver. In every segment the receiver advertises a window: the amount of free space left in its buffer. The sender must not have more unacknowledged data in flight than that window allows.

Because the window field is only 16 bits wide, the largest window in the original design was 65,535 bytes, which is too small for fast, long-distance links. The window scale option, introduced in RFC 1323 in 1992, lets both sides agree during the handshake to shift the window value left by up to 14 bits. This raises the largest possible window to about one gigabyte.

Sending many tiny segments wastes capacity, because each one carries at least 40 bytes of headers. Nagle's algorithm, described by John Nagle in RFC 896 in 1984, holds back small pieces of data while earlier data is still unacknowledged, and combines them into one segment. Interactive programs that need every keystroke sent at once can turn it off with the TCP_NODELAY socket option.

## Congestion control

Flow control protects the receiver; congestion control protects the network between the two ends. Early TCP had none. In October 1986 the Internet suffered the first of a series of congestion collapses, during which the throughput on the link between Lawrence Berkeley Laboratory and the University of California, Berkeley, fell from 32 kilobits per second to 40 bits per second. In response, Van Jacobson developed a set of algorithms that he published in 1988 in the paper "Congestion Avoidance and Control".

The sender keeps a second limit called the congestion window. A new connection begins in slow start: the congestion window starts small and grows by one segment for each acknowledgment received, which doubles it roughly every round trip. RFC 6928 raised the starting size of the congestion window to 10 segments. When the window reaches a level called the slow start threshold, the sender switches to congestion avoidance and grows the window by only about one segment per round trip.

Loss is taken as the sign of congestion. If the sender receives three duplicate acknowledgments in a row, it assumes a segment was lost and resends it straight away without waiting for the timeout; this is called fast retransmit. It is followed by fast recovery, in which the congestion window is cut in half and the sender carries on, with no return to slow start.

Versions of TCP congestion control were traditionally named after releases of BSD Unix. TCP Tahoe, from 1988, had slow start, congestion avoidance and fast retransmit. TCP Reno, from 1990, added fast recovery. NewReno, specified in RFC 6582, improved recovery when several segments are lost from one window.

Later algorithms were designed for faster networks. CUBIC grows the window as a cubic function of the time since the last loss, and has been the default in Linux since kernel version 2.6.19, released in 2006. BBR, published by Google in 2016, does not wait for loss at all; it builds a model of the path from measurements of the bottleneck bandwidth and the round-trip time.

## Keepalive and attacks

An idle TCP connection sends nothing at all, so a machine cannot tell whether the other end is still there. The optional keepalive feature sends an empty probe after a long quiet period. The default idle time before the first probe is 7200 seconds, which is two hours.

A SYN flood attack sends a server a large number of SYN segments, often with forged source addresses, and never completes the handshakes. Each half-open connection takes up a slot in the server's table until none are left for real clients. A common defence is SYN cookies, invented by Daniel J. Bernstein in 1996. With SYN cookies the server stores nothing when a SYN arrives. It encodes the connection details into the starting sequence number it sends back, and rebuilds the connection only when the final ACK of the handshake returns with that number.

## TCP and newer protocols

TCP delivers bytes strictly in order. If one segment is lost, all data behind it must wait even if it has already arrived, a problem known as head-of-line blocking. QUIC, standardized in RFC 9000 in May 2021, avoids it by running several independent streams over UDP, and it is the transport used by HTTP/3.
