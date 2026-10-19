<?php
// Dev router for PHP's built-in server (`php -S host:port router.php`).
//
// This PHP app uses extensionless, Apache-rewritten URLs (e.g. /history
// -> history.php). The built-in server has no rewrite engine, so without this the nav
// links 404. This maps extensionless paths to their .php file, serves real files
// (assets, existing .php) directly, and falls back to a folder's index.php.

$uri  = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$full = __DIR__ . $uri;

// 1) A real existing file (asset or explicit .php) -> let the server serve it as-is.
if ($uri !== '/' && file_exists($full) && !is_dir($full)) {
    return false;
}

// 2) Extensionless path -> matching .php (e.g. /.../history -> history.php).
if (!is_dir($full) && file_exists($full . '.php')) {
    chdir(dirname($full . '.php'));        // so the file's relative includes resolve
    require $full . '.php';
    return true;
}

// 3) Directory -> its index.php.
if (is_dir($full)) {
    $index = rtrim($full, '/\\') . DIRECTORY_SEPARATOR . 'index.php';
    if (file_exists($index)) {
        chdir(rtrim($full, '/\\'));
        require $index;
        return true;
    }
}

// 4) Nothing matched -> let the built-in server return its 404.
return false;
