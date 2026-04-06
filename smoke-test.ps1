$ErrorActionPreference = 'Stop'
function Pass($msg){ Write-Output "PASS: $msg" }
function FailStep($msg){ Write-Output "FAIL: $msg"; throw $msg }

$base = 'http://localhost:4000/api'

$health = Invoke-RestMethod -Method Get -Uri "$base/health"
if(-not $health.success){ FailStep 'Health endpoint not successful' }
Pass 'API health check'

$clientSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$seed = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$clientEmail = "smoke.client.$seed@lensworks.app"
$clientPassword = 'password123'

$registerBody = @{ email=$clientEmail; password=$clientPassword; fullName='Smoke Client'; role='client' } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -WebSession $clientSession -ContentType 'application/json' -Body $registerBody
if(-not $reg.success){ FailStep 'Client register failed' }
Pass 'Client register'

$meClient = Invoke-RestMethod -Method Get -Uri "$base/auth/me" -WebSession $clientSession
if(($meClient.data.user.role) -ne 'client'){ FailStep 'Client role mismatch on /auth/me' }
Pass 'Client auth/me role'

$vendors = Invoke-RestMethod -Method Get -Uri "$base/vendors"
if(-not $vendors.data.items -or $vendors.data.items.Count -lt 1){ FailStep 'No vendors returned' }
$vendor = $vendors.data.items[0]
$vendorSlug = $vendor.slug
Pass 'Vendor list'

$packages = Invoke-RestMethod -Method Get -Uri "$base/vendors/$vendorSlug/packages"
if(-not $packages.data.packages -or $packages.data.packages.Count -lt 1){ FailStep 'Vendor packages missing' }
$pkg = $packages.data.packages[0]
Pass 'Vendor packages'

$reviews = Invoke-RestMethod -Method Get -Uri "$base/vendors/$vendorSlug/reviews"
if(-not $reviews.success){ FailStep 'Vendor reviews failed' }
Pass 'Vendor reviews'

$cartItem = @{
  id = "smoke-item-$seed"
  photographer = $vendor.displayName
  photographerImage = $vendor.avatarUrl
  packageName = $pkg.name
  packageDescription = $pkg.description
  packagePrice = [double]$pkg.price
  addOns = @()
  subtotal = [double]$pkg.price
  serviceFee = [Math]::Round(([double]$pkg.price) * 0.05, 2)
  total = [Math]::Round(([double]$pkg.price) * 1.05, 2)
  deposit = [Math]::Round(([double]$pkg.price) * 1.05 * 0.2, 2)
  date = '2026-10-14'
  time = '10:00 AM'
  location = 'Bahrain Bay, Manama'
} | ConvertTo-Json -Depth 6
$addCart = Invoke-RestMethod -Method Post -Uri "$base/cart/items" -WebSession $clientSession -ContentType 'application/json' -Body $cartItem
if(-not $addCart.success){ FailStep 'Add cart item failed' }
Pass 'Cart add item'

$getCart = Invoke-RestMethod -Method Get -Uri "$base/cart" -WebSession $clientSession
if($getCart.data.count -lt 1){ FailStep 'Cart count not updated' }
Pass 'Cart fetch'

$checkoutBody = @{
  booking = @{ packageName = $pkg.name; total = [Math]::Round(([double]$pkg.price) * 1.05, 2); deposit = [Math]::Round(([double]$pkg.price) * 1.05 * 0.2, 2); date='2026-10-14'; time='10:00 AM'; location='Bahrain Bay, Manama'; duration='2 Hours' }
  customer = @{ firstName='Smoke'; lastName='Client'; email=$clientEmail }
} | ConvertTo-Json -Depth 6
$checkout = Invoke-RestMethod -Method Post -Uri "$base/checkout/confirm" -WebSession $clientSession -ContentType 'application/json' -Body $checkoutBody
if(-not $checkout.success){ FailStep 'Checkout confirm failed' }
$bookingId = $checkout.data.bookingId
Pass 'Checkout confirm'

$bookingsMine = Invoke-RestMethod -Method Get -Uri "$base/bookings/me" -WebSession $clientSession
if(-not ($bookingsMine.data.items | Where-Object { $_.id -eq $bookingId })){ FailStep 'New booking not visible in client bookings' }
Pass 'Client bookings list'

$payBalance = Invoke-RestMethod -Method Patch -Uri "$base/bookings/$bookingId/pay-balance" -WebSession $clientSession
if(-not $payBalance.success){ FailStep 'Pay balance failed' }
Pass 'Client pay balance'

$payMine = Invoke-RestMethod -Method Get -Uri "$base/payments/me" -WebSession $clientSession
if(($payMine.data.items | Measure-Object).Count -lt 2){ FailStep 'Client payment history count too low' }
Pass 'Client payment history'

$reviewBody = @{ rating = 5; body = 'Smoke test review submission.' } | ConvertTo-Json
$createReview = Invoke-RestMethod -Method Post -Uri "$base/vendors/$vendorSlug/reviews" -WebSession $clientSession -ContentType 'application/json' -Body $reviewBody
if(-not $createReview.success){ FailStep 'Create review failed' }
Pass 'Client create review'

$clientConversations = Invoke-RestMethod -Method Get -Uri "$base/messages" -WebSession $clientSession
if(-not $clientConversations.data.items -or $clientConversations.data.items.Count -lt 1){ FailStep 'Client conversations missing' }
$conversationId = $clientConversations.data.items[0].id
Pass 'Client conversations list'

$sendMsgBody = @{ body = 'Smoke test message from client.' } | ConvertTo-Json
$sendMsg = Invoke-RestMethod -Method Post -Uri "$base/messages/$conversationId/messages" -WebSession $clientSession -ContentType 'application/json' -Body $sendMsgBody
if(-not $sendMsg.success){ FailStep 'Client send message failed' }
Pass 'Client send message'

$vendorSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$vendorLoginBody = @{ email='vendor@lensworks.app'; password='password123' } | ConvertTo-Json
$vendorLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -WebSession $vendorSession -ContentType 'application/json' -Body $vendorLoginBody
if(-not $vendorLogin.success){ FailStep 'Vendor login failed' }
Pass 'Vendor login'

$vendorBookings = Invoke-RestMethod -Method Get -Uri "$base/bookings/vendor" -WebSession $vendorSession
if(-not ($vendorBookings.data.items | Where-Object { $_.id -eq $bookingId })){ FailStep 'New booking not visible for vendor' }
Pass 'Vendor bookings list'

$markCompleteBody = @{ status='COMPLETED' } | ConvertTo-Json
$markComplete = Invoke-RestMethod -Method Patch -Uri "$base/bookings/$bookingId/vendor-status" -WebSession $vendorSession -ContentType 'application/json' -Body $markCompleteBody
if(-not $markComplete.success){ FailStep 'Vendor mark complete failed' }
Pass 'Vendor mark complete'

$deliverBody = @{ bookingId = $bookingId } | ConvertTo-Json
$deliver = Invoke-RestMethod -Method Post -Uri "$base/galleries/deliver" -WebSession $vendorSession -ContentType 'application/json' -Body $deliverBody
if(-not $deliver.success){ FailStep 'Vendor deliver gallery failed' }
Pass 'Vendor deliver gallery'

$vendorPayments = Invoke-RestMethod -Method Get -Uri "$base/payments/vendor" -WebSession $vendorSession
if(($vendorPayments.data.items | Measure-Object).Count -lt 2){ FailStep 'Vendor payment history count too low' }
Pass 'Vendor payment history'

$vendorPackages = Invoke-RestMethod -Method Get -Uri "$base/vendors/me/packages" -WebSession $vendorSession
if(-not $vendorPackages.success){ FailStep 'Vendor packages me failed' }
Pass 'Vendor packages me'

$clientGalleries = Invoke-RestMethod -Method Get -Uri "$base/galleries" -WebSession $clientSession
if(-not ($clientGalleries.data.items | Where-Object { $_.id -eq $deliver.data.gallery.id })){ FailStep 'Delivered gallery not visible to client' }
Pass 'Client galleries include delivered gallery'

Write-Output "SMOKE_TEST_COMPLETE: SUCCESS"
