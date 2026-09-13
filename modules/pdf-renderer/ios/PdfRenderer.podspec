require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'PdfRenderer'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'Rasterises PDF pages using PDFKit.'
  s.description    = 'Renders PDF pages to images so the editor can display the real document.'
  s.author         = 'AltixCode'
  s.homepage       = 'https://www.altixcode.com'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
