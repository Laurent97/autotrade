-- Simple script to insert crypto addresses
-- Run this if the table exists but has no data

-- Insert crypto addresses
INSERT INTO crypto_addresses (crypto_type, address, is_active, network, xrp_tag) 
VALUES 
    ('BTC', '1FTUbAx5QNTWbxyerMPpxRbwqH3XnvwKQb', true, 'mainnet', NULL),
    ('USDT', 'TYdFjAfhWL9DjaDBAe5LS7zUjBqpYGkRYB', true, 'TRON', NULL),
    ('ETH', '0xd5fffaa3740af39c265563aec8c14bd08c05e838', true, 'mainnet', NULL),
    ('XRP', 'rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AV', true, 'mainnet', '476565842');

-- Verify the data was inserted
SELECT 
    crypto_type,
    address,
    is_active,
    network,
    xrp_tag
FROM crypto_addresses 
ORDER BY crypto_type;

-- Success message
SELECT 'Crypto addresses inserted successfully!' as status;
